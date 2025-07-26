from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO
from flask_apscheduler import APScheduler
from flask_mysqldb import MySQL
from flask_cors import CORS
import random, string, datetime

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = 'secret!'
CORS(app, supports_credentials=True)

# ─── MySQL CONFIG ─────────────────────────────────────────────────────────────
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'hsm_user'
app.config['MYSQL_PASSWORD'] = 'yardpass'
app.config['MYSQL_DB'] = 'yard_db'
mysql = MySQL(app)

# ─── SOCKET.IO FOR REAL‑TIME UPDATES ─────────────────────────────────────────
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ─── SCHEDULER FOR AUTO‑GENERATION ────────────────────────────────────────────
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

# ─── HELPER: Validate Saddle Location ─────────────────────────────────────────
def is_valid_location(loc: str) -> bool:
    try:
        row, columnstack, stack = loc.split('-')
        col_letter = columnstack[0]
        number_part = int(columnstack[1:])
        stack = int(stack)
    except:
        return False

    valid_rows = {
        'A': 15, 'B': 9, 'C': 9, 'D': 18, 'E': 9, 'F': 12,
        'O': 12, 'R': 5, 'P': 17, 'N': 8
    }

    if row not in valid_rows:
        return False
    if col_letter < 'A' or col_letter > 'K':
        return False
    if number_part < 1 or number_part > valid_rows[row]:
        return False
    if stack not in [1, 2, 3]:
        return False

    return True

# ─── INITIALIZE TABLES ────────────────────────────────────────────────────────
with app.app_context():
    cur = mysql.connection.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS coils (
            id INT AUTO_INCREMENT PRIMARY KEY,
            coil_id VARCHAR(13) UNIQUE NOT NULL,
            status VARCHAR(20),
            produced_ts DATETIME,
            placed_ts DATETIME,
            assigned_ts DATETIME,
            dispatched_ts DATETIME,
            placed_crane INT,
            assigned_crane INT,
            placed_location VARCHAR(20),
            assigned_location VARCHAR(20),
            current_location VARCHAR(20),
            weight FLOAT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            coil_id VARCHAR(13),
            crane_assigned INT,
            assign_time DATETIME,
            pick_location VARCHAR(20),
            drop_location VARCHAR(20),
            status VARCHAR(20),
            important TINYINT DEFAULT 0
        )
    """)
    mysql.connection.commit()
    cur.close()

# ─── HELPER: Generate Unique Coil ID ──────────────────────────────────────────
def generate_unique_coil_id():
    return 'Y' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))

# ─── AUTO‑GENERATION: Every 30s ───────────────────────────────────────────────
@scheduler.task('interval', id='auto_generate', seconds=30)
def auto_generate():
    with app.app_context():
        now = datetime.datetime.now()
        coil_id = generate_unique_coil_id()
        crane = random.randint(1, 3)
        weight = round(random.uniform(10.0, 50.0), 2)

        while True:
            row = random.choice(list({
                'A': 15, 'B': 9, 'C': 9, 'D': 18, 'E': 9, 'F': 12,
                'O': 12, 'R': 5, 'P': 17, 'N': 8
            }.keys()))
            col = random.choice([chr(i) for i in range(ord('A'), ord('K') + 1)])
            vertical = random.randint(1, {
                'A': 15, 'B': 9, 'C': 9, 'D': 18, 'E': 9, 'F': 12,
                'O': 12, 'R': 5, 'P': 17, 'N': 8
            }[row])
            stack = random.randint(1, 3)
            loc = f"{row}-{col}{vertical}-{stack}"
            if is_valid_location(loc):
                break

        cur = mysql.connection.cursor()
        cur.execute(
            """INSERT INTO coils 
               (coil_id, status, produced_ts, placed_ts, placed_crane, placed_location, current_location, weight)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (coil_id, 'Placed', now, now, crane, loc, loc, weight)
        )
        mysql.connection.commit()
        cur.close()

        print(f"[EMIT] Coil Generated: {coil_id} -> {loc}, Cr:{crane}, Wt:{weight}")
        socketio.emit('new_coil', {
            'coil_id': coil_id,
            'status': 'Placed',
            'crane': crane,
            'location': loc,
            'timestamp': now.strftime('%Y-%m-%d %H:%M:%S'),
            'weight': weight
        })

# ─── ROUTES ───────────────────────────────────────────────────────────────────
@app.route('/')
@app.route('/admin')
def admin():
    cur = mysql.connection.cursor()
    cur.execute(
        "SELECT coil_id, status, placed_crane, placed_location, current_location, weight "
        "FROM coils ORDER BY id DESC"
    )
    coils = cur.fetchall()
    cur.close()
    return render_template('admin.html', coils=coils)

@app.route('/operator')
def operator():
    return render_template('operator.html')

@app.route('/add_coil', methods=['POST'])
def add_coil():
    data = request.form or request.get_json()
    timestamp_str = data['timestamp']
    ts = datetime.datetime.strptime(timestamp_str, '%Y-%m-%dT%H:%M') if 'T' in timestamp_str else datetime.datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
    location = data.get('location') or data.get('current_location')

    if not is_valid_location(location):
        return jsonify({'status': 'error', 'message': 'Invalid saddle location'}), 400

    cur = mysql.connection.cursor()
    cur.execute(
        """INSERT INTO coils 
           (coil_id, status, produced_ts, placed_ts, placed_crane, placed_location, current_location, weight) 
           VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
        (data['coil_id'], 'Placed', ts, ts, data.get('crane_id'), location, location, data.get('weight'))
    )
    mysql.connection.commit()
    cur.close()

    print(f"[EMIT] Manual Coil Added: {data['coil_id']}")
    socketio.emit('new_coil', {
        'coil_id': data['coil_id'],
        'status': 'Placed',
        'crane': data.get('crane_id'),
        'location': location,
        'timestamp': ts.strftime('%Y-%m-%d %H:%M:%S'),
        'weight': data.get('weight')
    })
    return jsonify({'status': 'coil added'})

@app.route('/assign_task', methods=['POST'])
def assign_task():
    data = request.form or request.get_json()
    now = datetime.datetime.now()
    coil_id = data['coil_id']
    crane_id = data.get('crane_id')
    from_location = data.get('from_location')
    to_location = data.get('to_location')

    important_raw = data.get('important', 0)
    important = 1 if str(important_raw).lower() in ['1', 'true', 'urgent'] else 0

    cur = mysql.connection.cursor()
    cur.execute(
        """INSERT INTO tasks 
           (coil_id, crane_assigned, assign_time, pick_location, drop_location, status, important) 
           VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (coil_id, crane_id, now, from_location, to_location, 'Assigned', important)
    )
    mysql.connection.commit()
    task_id = cur.lastrowid
    cur.close()

    cur = mysql.connection.cursor()
    cur.execute(
        """UPDATE coils SET status=%s, assigned_ts=%s, assigned_crane=%s, assigned_location=%s, current_location=%s 
           WHERE coil_id=%s""",
        ('Assigned', now, crane_id, to_location, to_location, coil_id)
    )
    mysql.connection.commit()
    cur.close()

    cur = mysql.connection.cursor()
    cur.execute("SELECT weight FROM coils WHERE coil_id = %s", (coil_id,))
    weight_result = cur.fetchone()
    weight = weight_result[0] if weight_result else 0
    cur.close()

    print(f"[EMIT] Task Assigned: {coil_id} -> {to_location} | Important: {important}")
    socketio.emit('new_task', {
        'task_id': f"T{task_id:03d}",
        'coil_id': coil_id,
        'pickup_location': from_location,
        'drop_location': to_location,
        'status': 'assigned',
        'assigned_at': now.strftime('%Y-%m-%d %H:%M:%S'),
        'weight': weight,
        'important': important
    })

    return jsonify({'status': 'task assigned'})

@app.route('/coils', methods=['GET'])
def get_coils():
    cur = mysql.connection.cursor()
    cur.execute(
        "SELECT coil_id, status, placed_crane, placed_location, current_location, weight, "
        "DATE_FORMAT(placed_ts, '%Y-%m-%d %H:%i:%s') "
        "FROM coils ORDER BY id DESC"
    )
    rows = cur.fetchall()
    cur.close()
    return jsonify([
        {'coil_id': r[0], 'status': r[1], 'crane': r[2], 'placed_location': r[3],
         'current_location': r[4], 'weight': r[5], 'timestamp': r[6]}
        for r in rows
    ])

@app.route('/tasks', methods=['GET'])
def get_tasks():
    cur = mysql.connection.cursor()
    cur.execute(
        "SELECT id, coil_id, crane_assigned, pick_location, drop_location, status, "
        "DATE_FORMAT(assign_time, '%Y-%m-%d %H:%i:%s'), important "
        "FROM tasks ORDER BY id DESC"
    )
    rows = cur.fetchall()
    cur.close()
    return jsonify([
        {
            'task_id': r[0],
            'coil_id': r[1],
            'crane_assigned': r[2],
            'pick_location': r[3],
            'drop_location': r[4],
            'status': r[5],
            'timestamp': r[6],
            'important': r[7]
        }
        for r in rows
    ])

@socketio.on('connect')
def on_connect():
    print('Client connected')

@socketio.on('disconnect')
def on_disconnect():
    print('Client disconnected')

@app.route('/dashboard', defaults={'path': ''})
@app.route('/dashboard/<path:path>')
def serve_dashboard(path):
    return render_template('dashboard.html')

if __name__ == '__main__':
    socketio.run(app, debug=True)
