// src/tabs/SkillsTab.tsx

import React, { useState, useEffect } from 'react';
import { fetchSkills, createSkill, updateSkill, deleteSkill, CreateSkillDto, UpdateSkillDto } from '../services';
import { Skill } from '../api/types';

export function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating a skill
  const [newSkill, setNewSkill] = useState<CreateSkillDto>({
    name: '',
    version: '1.0.0',
    category: 'general',
    description: '',
  });

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      setLoading(true);
      const data = await fetchSkills();
      setSkills(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch skills');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkill.name) return;

    try {
      await createSkill(newSkill);
      setNewSkill({ ...newSkill, name: '', description: '' }); // Reset form
      loadSkills();
    } catch (err: any) {
      setError(err.message || 'Failed to create skill');
    }
  };

  const handleToggleSkill = async (id: string, currentStatus: boolean) => {
    try {
      const updateData: UpdateSkillDto = { enabled: !currentStatus };
      await updateSkill(id, updateData);
      loadSkills();
    } catch (err: any) {
      setError(err.message || 'Failed to update skill');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this skill?')) return;
    try {
      await deleteSkill(id);
      loadSkills();
    } catch (err: any) {
      setError(err.message || 'Failed to delete skill');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800';
      case 'warn':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-4">Loading skills...</div>;
  if (error) return <div className="p-4" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Skills</h1>
      <p className="mb-6 text-gray-600">Manage and monitor your agent skills.</p>
      
      {/* Create Skill Form */}
      <div className="mb-6 border rounded p-4 bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Create New Skill</h2>
        <form onSubmit={handleCreateSkill} className="flex flex-col space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input 
              type="text" 
              placeholder="Skill Name" 
              value={newSkill.name}
              onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
              className="border rounded px-3 py-2"
              required
            />
            <input 
              type="text" 
              placeholder="Version (e.g., 1.0.0)" 
              value={newSkill.version}
              onChange={(e) => setNewSkill({ ...newSkill, version: e.target.value })}
              className="border rounded px-3 py-2"
            />
            <input 
              type="text" 
              placeholder="Category (e.g., 'general', 'dev')" 
              value={newSkill.category}
              onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
              className="border rounded px-3 py-2"
            />
          </div>
          <input 
            type="text" 
            placeholder="Description" 
            value={newSkill.description}
            onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
            className="border rounded px-3 py-2"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto">
            Create Skill
          </button>
        </form>
      </div>

      {/* Skills List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skills.map((skill) => (
          <div key={skill.id} className="border rounded p-4 shadow-md">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold">{skill.name}</h3>
              <div className="flex space-x-1">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(skill.status)}`}>
                  {skill.status}
                </span>
                <button 
                  onClick={() => handleToggleSkill(skill.id, skill.enabled)}
                  className={`px-2 py-1 rounded text-xs font-semibold ${skill.enabled ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'}`}
                >
                  {skill.enabled ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-2">{skill.version} • {skill.category}</p>
            <p className="text-sm mb-3">{skill.description}</p>
            <div className="flex justify-between items-center text-xs text-gray-600">
              <span>Usage (24h): {skill.usage24h}</span>
              <button 
                onClick={() => handleDeleteSkill(skill.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {skills.length === 0 && (
          <div className="col-span-full text-center text-gray-500 p-4">
            No skills found.
          </div>
        )}
      </div>
    </div>
  );
}
