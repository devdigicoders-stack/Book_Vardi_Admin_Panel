import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  MapPin, 
  CheckCircle,
  Building,
  PackageCheck
} from 'lucide-react';
import { useAdminData } from '../../context/AdminDataContext';
import SchoolModal from '../modals/SchoolModal';

export default function SchoolsTab() {
  const { schools, addSchool, updateSchool, deleteSchool } = useAdminData();

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState(null);

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.board.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingSchool(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (school) => {
    setEditingSchool(school);
    setModalOpen(true);
  };

  const handleSaveSchool = (formData) => {
    if (editingSchool) {
      updateSchool(editingSchool.id, formData);
    } else {
      addSchool(formData);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name} from partner schools?`)) {
      deleteSchool(id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl text-gray-900 flex items-center gap-2">
            <GraduationCap className="text-teal-700" size={24} /> Partner Schools & Institutions
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Onboard schools, assign exclusive uniform sets & NCERT textbook kits, and manage institutional commission sharing.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-hover text-brand-teal-dark font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus size={16} /> Onboard New School
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs flex items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search school by name, board, or city..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-brand-yellow outline-hidden"
          />
        </div>
      </div>

      {/* Schools Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredSchools.map((school) => (
          <div
            key={school.id}
            className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <Building size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900 leading-snug">{school.name}</h3>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-semibold text-purple-800 bg-purple-50 px-2 py-0.2 rounded-md">
                      {school.board}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><MapPin size={11} /> {school.city}</span>
                  </div>
                </div>
              </div>

              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                school.status === 'Partner Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {school.status}
              </span>
            </div>

            {/* School Metrics */}
            <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-center text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Students</span>
                <div className="font-bold text-gray-800 mt-0.5">{school.studentCount}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Classes</span>
                <div className="font-bold text-gray-800 mt-0.5">{school.classes}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Rev Share</span>
                <div className="font-bold text-teal-800 mt-0.5">{school.commissionShare || '5%'}</div>
              </div>
            </div>

            {/* Coordinator & Exclusive Kit */}
            <div className="text-xs text-gray-600 space-y-1">
              <div>Coordinator: <span className="font-semibold text-gray-900">{school.contactPerson}</span></div>
              <div className="text-[11px] text-gray-500">{school.email} • {school.phone}</div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              {school.exclusiveKit ? (
                <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <PackageCheck size={14} /> Official Uniform & Book Kit Live
                </span>
              ) : (
                <span className="text-[11px] text-gray-400">Standard Catalog Only</span>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(school)}
                  className="p-1.5 text-gray-500 hover:text-teal-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Edit School"
                >
                  <Edit3 size={15} />
                </button>
                <button
                  onClick={() => handleDelete(school.id, school.name)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove School"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* School Modal */}
      <SchoolModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSchool}
        school={editingSchool}
      />

    </div>
  );
}
