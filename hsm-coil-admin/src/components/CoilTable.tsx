import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Toast,
  ToastTitle,
  ToastDescription,
  ToastViewport,
  ToastProvider
} from "@/components/ui/toast";

interface Coil {
  coil_id: string;
  location: string;
  timestamp: string;
  status: 'coil_yard' | 'dispatched';
  weight?: number;
}

interface CoilTableProps {
  coils: Coil[];
}

const socket = io("http://localhost:5000"); // adjust if running elsewhere

const CoilTable = ({ coils: initialCoils }: CoilTableProps) => {
  const [coils, setCoils] = useState<Coil[]>(initialCoils);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCoilToast, setNewCoilToast] = useState<Coil | null>(null);

  useEffect(() => {
    socket.on('new_coil', (data) => {
      const newCoil: Coil = {
        coil_id: data.coil_id,
        location: data.location,
        timestamp: data.timestamp,
        status: 'coil_yard',
        weight: data.weight,
      };
      setCoils(prev => [newCoil, ...prev]);
      setNewCoilToast(newCoil);
      setTimeout(() => setNewCoilToast(null), 4000); // Auto-hide
    });

    return () => {
      socket.off('new_coil');
    };
  }, []);

  const filteredCoils = coils.filter(coil =>
    coil.coil_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coil.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    return status === 'coil_yard'
      ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
      : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
  };

  const getStatusText = (status: string) => {
    return status === 'coil_yard' ? 'Coil Yard' : 'Dispatched';
  };

  return (
    <ToastProvider>
      <div className="space-y-6">
        <div className="flex items-center">
          <Input
            placeholder="Search coils..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-50 border-gray-200 max-w-sm focus:bg-white transition-colors"
          />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <div className="overflow-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Coil ID</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Location</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Weight</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-6 py-4 text-left font-semibold text-gray-700">Date & Time</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredCoils.map((coil, index) => (
                  <tr
                    key={`${coil.coil_id}-${index}`}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 font-mono text-blue-600 font-semibold">{coil.coil_id}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{coil.location}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{coil.weight ? `${coil.weight}T` : 'N/A'}</td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={`${getStatusBadge(coil.status)} transition-colors duration-150 font-medium`}>
                        {getStatusText(coil.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">{coil.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredCoils.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
            <div className="text-lg font-medium mb-2">No coils found</div>
            <div className="text-sm">Try adjusting your search criteria</div>
          </div>
        )}
      </div>

      {/* 🔔 Toast when new coil is added */}
      {newCoilToast && (
        <Toast>
          <ToastTitle>New Coil Added</ToastTitle>
          <ToastDescription>
            ID: <span className="font-mono">{newCoilToast.coil_id}</span><br />
            Weight: {newCoilToast.weight}T at {newCoilToast.location}
          </ToastDescription>
        </Toast>
      )}
      <ToastViewport />
    </ToastProvider>
  );
};

export default CoilTable;
