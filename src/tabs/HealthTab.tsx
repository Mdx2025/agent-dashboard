// src/tabs/HealthTab.tsx

import React, { useState, useEffect } from 'react';
import { fetchServices, fetchHealthChecks } from '../services';
import { Service, HealthCheck } from '../api/types';

export function HealthTab() {
  const [services, setServices] = useState<Service[]>([]);
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const [servicesData, checksData] = await Promise.all([
        fetchServices(),
        fetchHealthChecks()
      ]);
      setServices(servicesData);
      setHealthChecks(checksData);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch health data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading health status...</div>;
  if (error) return <div className="p-4" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Health & Services</h1>
      <p className="mb-6 text-gray-600">System health checks and service status.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Services</h2>
          {services.length === 0 ? (
            <div className="border rounded p-4 shadow-md">No services found.</div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.name} className="border rounded p-4 shadow-md">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-medium">{service.name}</h3>
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      service.status === 'healthy' ? 'bg-green-100 text-green-800' : 
                      service.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {service.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Host: {service.host}:{service.port}</p>
                    <p>Latency: {service.latencyMs}ms</p>
                    <p>CPU: {service.cpuPct}% | Mem: {service.memPct}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Health Checks */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Health Checks</h2>
          {healthChecks.length === 0 ? (
            <div className="border rounded p-4 shadow-md">No health checks found.</div>
          ) : (
            <ul className="space-y-2">
              {healthChecks.map((check, index) => (
                <li key={index} className="flex justify-between items-center border-b pb-2">
                  <div className="flex-1">
                    <p className="font-medium">{check.name}</p>
                    <p className="text-sm text-gray-500">{check.detail}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-3 h-3 rounded-full ${
                      check.status === 'pass' ? 'bg-green-500' : 
                      check.status === 'warn' ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`} />
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      check.status === 'pass' ? 'bg-green-100 text-green-800' : 
                      check.status === 'warn' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {check.status}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">{check.durationMs}ms</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
