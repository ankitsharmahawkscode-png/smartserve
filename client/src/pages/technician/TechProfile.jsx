import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, Button } from '../../components/ui.jsx';
import Input from '../../components/Input.jsx';
import { Checkbox } from '../../components/Fields.jsx';

export default function TechProfile() {
  const { user } = useAuth();
  const [isAvailable, setIsAvailable] = useState(user.technician?.isAvailable || false);
  const [skills, setSkills] = useState(user.technician?.skills || []);

  const availableSkills = ['AC Repair', 'Plumbing', 'Electrical', 'Carpentry', 'Home Cleaning'];

  const toggleSkill = (skill) => {
    setSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl sm:text-3xl font-extrabold">Technician Profile</h1>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold mb-4">Personal Info</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name" value={user.name} disabled />
          <Input label="Phone Number" value={user.phone} disabled />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Work Status</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <span className={`text-sm font-bold ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
            <div className={`w-12 h-6 rounded-full transition-colors ${isAvailable ? 'bg-green-500' : 'bg-gray-300'} relative`}>
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isAvailable ? 'translate-x-6' : ''}`} />
            </div>
            <input type="checkbox" className="hidden" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
          </label>
        </div>
        <p className="text-sm text-ink-muted">Jab aap Available hote hain, tabhi aapko nayi jobs assign ki jati hain.</p>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-bold mb-4">Skills / Services I Provide</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {availableSkills.map(skill => (
            <div 
              key={skill} 
              onClick={() => toggleSkill(skill)}
              className={`p-3 rounded-lg border text-center cursor-pointer font-semibold text-sm transition-colors ${skills.includes(skill) ? 'bg-brand-tint border-brand text-brand-dark' : 'bg-white border-line text-gray-600'}`}
            >
              {skill}
            </div>
          ))}
        </div>
        <Button className="mt-6" onClick={() => { /* API Call to save */ }}>Save Skills</Button>
      </Card>
    </div>
  );
}