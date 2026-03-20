import React, { useState } from 'react';
import { 
  Files, 
  Search, 
  ChevronRight, 
  FileText, 
  MoreHorizontal, 
  Download, 
  Share2, 
  Trash2, 
  Upload,
  Filter,
  ArrowUpRight,
  Folder,
  File,
  FileSignature
} from 'lucide-react';

const MOCK_DOCUMENTS = [
  { id: 1, name: 'Initial Pleading - Smith Case.pdf', folder: 'Client Matters', size: '2.4 MB', type: 'PDF', lastModified: '2023-10-20', author: 'Sarah Jenkins' },
  { id: 2, name: 'Sterling Merger Agreement v3.docx', folder: 'Client Matters', size: '1.1 MB', type: 'DOCX', lastModified: '2023-10-22', author: 'Michael Ross' },
  { id: 3, name: 'Evidence - Photo Log 001.zip', folder: 'Evidence', size: '45.8 MB', type: 'ZIP', lastModified: '2023-09-15', author: 'Amy Lee' },
  { id: 4, name: 'Court Ruling - NY Dist 4.pdf', folder: 'Court Rulings', size: '840 KB', type: 'PDF', lastModified: '2023-08-01', author: 'System' },
  { id: 5, name: 'Standard Retainer Template.docx', folder: 'Templates', size: '45 KB', type: 'DOCX', lastModified: '2023-01-10', author: 'Sarah Jenkins' },
  { id: 6, name: 'Financial Audit 2023.xlsx', folder: 'Administrative', size: '3.2 MB', type: 'XLSX', lastModified: '2023-10-05', author: 'Admin' },
  { id: 7, name: 'Deposition Transcript - Peterson.pdf', folder: 'Evidence', size: '12.6 MB', type: 'PDF', lastModified: '2023-10-18', author: 'Amy Lee' },
];

const DocumentsView = () => {
  const [selectedFolder, setSelectedFolder] = useState('All Documents');
  const [searchQuery, setSearchQuery] = useState('');
  
  const folders = ['All Documents', 'Client Matters', 'Court Rulings', 'Evidence', 'Templates', 'Administrative'];

  const filteredDocs = MOCK_DOCUMENTS.filter(doc => {
    const matchesFolder = selectedFolder === 'All Documents' || doc.folder === selectedFolder;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 overflow-hidden">
      {/* Sidebar - Folder Navigation */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900 flex items-center gap-2 bg-slate-50/50">
          <Files size={18} className="text-amber-600"/> Case Repository
        </div>
        <div className="p-2 overflow-y-auto flex-1 space-y-1">
          {folders.map((folder) => (
            <button
              key={folder}
              onClick={() => setSelectedFolder(folder)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-sm font-medium transition-all group ${
                selectedFolder === folder 
                ? 'bg-amber-50 text-amber-700' 
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                {folder === 'All Documents' ? <Files size={16} /> : <Folder size={16} />}
                <span>{folder}</span>
              </div>
              <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity ${selectedFolder === folder ? 'opacity-100' : ''}`} />
            </button>
          ))}
          
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 px-3 mb-2 uppercase tracking-widest">Saved AI Queries</div>
            <button className="w-full flex items-center gap-3 p-2.5 text-xs text-slate-500 hover:text-amber-600 transition-colors">
              <Search size={14} /> "Force Majeure Clauses"
            </button>
            <button className="w-full flex items-center gap-3 p-2.5 text-xs text-slate-500 hover:text-amber-600 transition-colors">
              <Search size={14} /> "Liability Limitations"
            </button>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                <span>Storage Used</span>
                <span className="font-semibold">64%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-[64%]"></div>
            </div>
        </div>
      </div>

      {/* Main Content - Document List */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{selectedFolder}</h1>
            <p className="text-slate-500 text-sm">Showing {filteredDocs.length} items in this category.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search repository..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-md transition-all">
              <Upload size={16} /> <span className="hidden lg:inline">Upload</span>
            </button>
          </div>
        </div>

        {/* Document Grid/Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Size</th>
                  <th className="px-6 py-4">Last Modified</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.length > 0 ? (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 group cursor-pointer transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            doc.type === 'PDF' ? 'bg-red-50 text-red-600' :
                            doc.type === 'DOCX' ? 'bg-blue-50 text-blue-600' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {doc.type === 'PDF' ? <FileSignature size={18} /> : <FileText size={18} />}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">{doc.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">By {doc.author}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                          {doc.folder}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{doc.size}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{doc.lastModified}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all" title="Download">
                            <Download size={16} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all" title="AI Summary">
                            <ArrowUpRight size={16} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-all">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-20 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                            <Files size={48} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium">No documents found</p>
                            <p className="text-sm">Try adjusting your search or category filters.</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsView;
