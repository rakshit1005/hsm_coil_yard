// ... (unchanged imports)
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import CoilTable from './CoilTable';
import { useToast } from '@/hooks/use-toast';

interface Coil {
  coil_id: string;
  location: string;
  timestamp: string;
  status: 'coil_yard' | 'dispatched';
  weight?: number;
}

const CoilDashboard = () => {
  const [coils, setCoils] = useState<Coil[]>([]);
  const [coilId, setCoilId] = useState<string>('');
  const [dropLocation, setDropLocation] = useState<string>('');
  const [important, setImportant] = useState<boolean>(false);
  const [newCoil, setNewCoil] = useState<Coil | null>(null);
  const { toast } = useToast();

  const socket = io('http://localhost:5000');

  useEffect(() => {
    fetch('/coils')
      .then(res => res.json())
      .then(data => {
        const transformed = data.map((item: any) => ({
          coil_id: item.coil_id,
          location: item.current_location,
          timestamp: item.timestamp,
          status: item.status === 'Dispatched' ? 'dispatched' : 'coil_yard',
          weight: item.weight
        }));
        setCoils(transformed);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to fetch coil data from backend.",
          variant: "destructive"
        });
      });

    socket.on('new_coil', (data: Coil) => {
      const newCoil: Coil = {
        coil_id: data.coil_id,
        location: data.location,
        timestamp: data.timestamp,
        status: 'coil_yard',
        weight: data.weight,
      };

      setCoils(prev => [newCoil, ...prev.slice(0, 19)]);
      setNewCoil(newCoil);

      toast({
        title: 'New Coil Produced',
        description: `${newCoil.coil_id} placed at ${newCoil.location}`,
      });
    });

    return () => {
      socket.off('new_coil');
    };
  }, [toast]);

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coilId || !dropLocation) {
      toast({
        title: "Error",
        description: "Please enter coil ID and select drop location",
        variant: "destructive",
      });
      return;
    }

    const selected = coils.find(c => c.coil_id === coilId);

    fetch('/assign_task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coil_id: coilId,
        crane_id: 1,
        from_location: selected?.location,
        to_location: dropLocation,
        important: Number(important ? 1 : 0) // Fixed here
      }),
    })
      .then(res => res.json())
      .then(() => {
        toast({
          title: "Task Assigned",
          description: `Crane assigned to move ${coilId} to ${dropLocation}`,
        });

        setCoils(prev =>
          prev.map(coil =>
            coil.coil_id === coilId
              ? { ...coil, status: 'dispatched', location: dropLocation }
              : coil
          )
        );

        setCoilId('');
        setDropLocation('');
        setImportant(false);
      })
      .catch(() => {
        toast({
          title: "Error",
          description: "Failed to assign task to crane.",
          variant: "destructive"
        });
      });
  };

  const totalWeight = coils.reduce((sum, coil) => sum + (coil.weight || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">HSM Coil Yard</h1>
            <p className="text-lg text-orange-600 font-medium mt-1">Jindal Stainless Limited</p>
          </div>
          <div className="flex items-center space-x-6">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 px-4 py-2 text-sm font-medium">
              System Online
            </Badge>
            <div className="text-right bg-gray-50 rounded-lg px-4 py-3">
              <p className="text-sm text-gray-500 font-medium">Last Update</p>
              <p className="text-sm font-mono text-gray-900 font-semibold">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-gray-700 text-lg font-semibold">Total Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {totalWeight.toFixed(1)}T
              </div>
              <p className="text-sm text-gray-500">Total coil weight in coil yard</p>
            </CardContent>
          </Card>

          {newCoil && (
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-gray-700 text-lg font-semibold">Latest Coil Produced</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-xl font-bold text-blue-600">{newCoil.coil_id}</div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500 font-medium">Location:</span>
                      <p className="text-gray-900 font-semibold">{newCoil.location}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium">Weight:</span>
                      <p className="text-gray-900 font-semibold">{newCoil.weight}T</p>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                    <span className="font-medium">Produced:</span> {newCoil.timestamp}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900 flex items-center justify-between text-xl font-semibold">
                  Coil Placements
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-1 text-sm font-medium">
                    {coils.length} Total
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <CoilTable coils={coils} />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-900 text-xl font-semibold">Assign Crane Task</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAssignTask} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Coil ID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter Coil ID"
                        value={coilId}
                        onChange={(e) => setCoilId(e.target.value.toUpperCase())}
                        className="border border-gray-200 rounded px-3 py-2 w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setImportant(!important)}
                        className={`text-sm font-bold px-3 py-2 rounded shadow-sm transition-colors ${important ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {important ? 'URGENT' : 'Mark URGENT'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Drop Location</label>
                    <Select value={dropLocation} onValueChange={setDropLocation}>
                      <SelectTrigger className="bg-gray-50 border-gray-200">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Road-1">Road-1</SelectItem>
                        <SelectItem value="Road-2">Road-2</SelectItem>
                        <SelectItem value="Road-3">Road-3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-md"
                  >
                    Assign Task
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoilDashboard;
