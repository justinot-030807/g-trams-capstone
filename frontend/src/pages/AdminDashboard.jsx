import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

// icons and images
import dashboardIcon from '../assets/dashboard-icon.png';
import analyticsIcon from '../assets/analytics-icon.png';
import usersIcon from '../assets/users-icon.png';
import searchIcon from '../assets/search-icon.png';
import masterlistIcon from '../assets/masterlist-icon.png';
import scheduleIcon from '../assets/schedule-icon.png';
import printerIcon from '../assets/printer.png';

// loading gif reference
import loadingGif from '../assets/loading.gif'; 

export default function AdminDashboard() {
    // loading screen state
    const [isLoading, setIsLoading] = useState(true);

    const [activeTab, setActiveTab] = useState('admin'); 
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const [franchises, setFranchises] = useState([]);
    const [users, setUsers] = useState([]); 
    const [searchTerm, setSearchTerm] = useState(''); 
    const [filterToda, setFilterToda] = useState('All'); 
    const [historyLogs, setHistoryLogs] = useState([]); 
    const [reports, setReports] = useState([]); 
    
    const [analyticsMonth, setAnalyticsMonth] = useState('All');
    
    const [selectedFranchise, setSelectedFranchise] = useState(null); 
    const [showFormModal, setShowFormModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [viewModalData, setViewModalData] = useState({ status: '', eSigned: false, releaseDate: '' });
    const [userModal, setUserModal] = useState({ isOpen: false, mode: 'view', data: null });
    const [passwordPrompt, setPasswordPrompt] = useState({ isOpen: false, action: null, password: '' });
    const [replyModal, setReplyModal] = useState({ isOpen: false, reportId: null, responseText: '' });

    const [formData, setFormData] = useState({ operator: '', plateNo: '', todaName: '', zone: '', make: '', made: '', motorNo: '', chassisNo: '', dateApplied: new Date().toISOString().split('T')[0], cedulaDate: '', cedulaAddress: '', cedulaSerialNo: '', applicationType: 'New', status: 'Active' });
    const [userFormData, setUserFormData] = useState({ name: '', email: '', role: '', address: '' });
    const [calendarEvents, setCalendarEvents] = useState([]);
    const [calendarForm, setCalendarForm] = useState({ date: '', status: 'Available', note: '' });

    const navigate = useNavigate();
    const token = localStorage.getItem('token'); 

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // fetch data with loading state
    useEffect(() => {
        if (!token) {
            navigate('/login');
        } else {
            const loadAllData = async () => {
                setIsLoading(true); 
                try {
                    await Promise.all([
                        fetchFranchises(),
                        fetchUsers(),
                        fetchCalendarEvents(),
                        fetchReports()
                    ]);
                } catch (error) {
                    console.error("Error loading data", error);
                } finally {
                    setIsLoading(false); 
                }
            };
            loadAllData();
        }
    }, [navigate, token]);

    // process history logs
    useEffect(() => {
        let logs = [];
        franchises.forEach(f => {
            if (f.updatedAt || f.dateApplied) {
                logs.push({ id: `f-upd-${f._id}`, title: `Franchise: ${f.plateNo}`, desc: `Status marked as ${f.status}`, date: new Date(f.updatedAt || f.dateApplied), color: f.status === 'Active' ? 'var(--color-brand)' : f.status === 'Pending' ? 'var(--color-warning)' : 'var(--color-danger)' });
            }
        });
        users.forEach(u => {
            if (u.createdAt) { logs.push({ id: `u-${u._id}`, title: `New User Registration`, desc: `${u.name} registered as ${u.role}`, date: new Date(u.createdAt), color: '#3b82f6' }); }
        });
        logs.sort((a, b) => b.date - a.date);
        setHistoryLogs(logs.slice(0, 15));
    }, [franchises, users]);

    const fetchReports = async () => {
        const res = await fetch('https://g-trams-web2.onrender.com/api/v1/reports', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setReports(await res.json());
    };

    const fetchCalendarEvents = async () => {
        const res = await fetch('https://g-trams-web2.onrender.com/api/v1/calendar', { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) setCalendarEvents(await res.json());
    };

    const fetchFranchises = async () => {
        const res = await fetch('https://g-trams-web2.onrender.com/api/v1/franchises', { headers: { 'Authorization': `Bearer ${token}` } });
        if(res.ok) setFranchises(await res.json());
    };

    const fetchUsers = async () => {
        const res = await fetch('https://g-trams-web2.onrender.com/api/v1/auth', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setUsers(await res.json());
    };

    // event handlers
    const handleAddEvent = async (e) => { e.preventDefault(); try { const res = await fetch('https://g-trams-web2.onrender.com/api/v1/calendar', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(calendarForm) }); if(res.ok) { alert('Saved!'); setCalendarForm({ date: '', status: 'Available', note: '' }); fetchCalendarEvents(); } } catch (e) { console.error(e); } };
    const handleDeleteEvent = async (id) => { if(!window.confirm("Delete this schedule?")) return; try { const res = await fetch(`https://g-trams-web2.onrender.com/api/v1/calendar/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if(res.ok) fetchCalendarEvents(); } catch(e) { console.error(e); } };
    const handleLogout = () => { localStorage.removeItem('token'); navigate('/login'); };
    const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const getImageUrl = (path) => { if (!path) return ''; return path.startsWith('http') ? path : `https://g-trams-web2.onrender.com/${path.replace(/\\/g, '/')}`; };
    const switchTab = (tab) => { setActiveTab(tab); setIsSidebarOpen(false); };
    
    const handleAdvancedApproval = async (e) => { e.preventDefault(); let reason = ''; if (viewModalData.status === 'Cancelled') { reason = window.prompt("Please enter the reason for cancellation:"); if (!reason) return; } try { const res = await fetch(`https://g-trams-web2.onrender.com/api/v1/franchises/${selectedFranchise._id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ status: viewModalData.status, cancelReason: reason, eSigned: viewModalData.eSigned, releaseDate: viewModalData.releaseDate }) }); if (res.ok) { alert(`Updated Successfully!`); fetchFranchises(); setSelectedFranchise(null); } } catch (e) { console.error(e); } };
    const handleAdminReply = async (e) => { e.preventDefault(); try { const res = await fetch(`https://g-trams-web2.onrender.com/api/v1/reports/${replyModal.reportId}/respond`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ response: replyModal.responseText }) }); if (res.ok) { alert('Reply sent! Status changed to Resolved.'); setReplyModal({ isOpen: false, reportId: null, responseText: '' }); fetchReports(); } } catch (error) { console.error(error); } };
    const openViewModal = (franchise) => { setSelectedFranchise(franchise); setViewModalData({ status: franchise.status, eSigned: franchise.eSigned || false, releaseDate: franchise.releaseDate || '' }); };
    const openAddModal = () => { setFormData({ operator: '', plateNo: '', todaName: '', zone: '', make: '', made: '', motorNo: '', chassisNo: '', dateApplied: new Date().toISOString().split('T')[0], cedulaDate: '', cedulaAddress: '', cedulaSerialNo: '', applicationType: 'New', status: 'Active' }); setEditingId(null); setShowFormModal(true); };
    const openEditModal = (franchise) => { setFormData({ operator: franchise.operator?._id || '', plateNo: franchise.plateNo || '', todaName: franchise.todaName || '', zone: franchise.zone || '', make: franchise.make || '', made: franchise.made || '', motorNo: franchise.motorNo || '', chassisNo: franchise.chassisNo || '', dateApplied: franchise.dateApplied ? new Date(franchise.dateApplied).toISOString().split('T')[0] : '', cedulaDate: franchise.cedulaDate ? new Date(franchise.cedulaDate).toISOString().split('T')[0] : '', cedulaAddress: franchise.cedulaAddress || '', cedulaSerialNo: franchise.cedulaSerialNo || '', applicationType: franchise.applicationType || 'New', status: franchise.status || 'Active' }); setEditingId(franchise._id); setShowFormModal(true); };
    
    const handleSaveFranchise = async (e) => { e.preventDefault(); const url = editingId ? `https://g-trams-web2.onrender.com/api/v1/franchises/${editingId}` : 'https://g-trams-web2.onrender.com/api/v1/franchises'; const method = editingId ? 'PUT' : 'POST'; try { const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(formData) }); if (res.ok) { alert(`Saved!`); setShowFormModal(false); fetchFranchises(); } else { alert('Failed.'); } } catch (e) { console.error(e); } };
    const executeDeleteFranchise = async (id) => { try { const res = await fetch(`https://g-trams-web2.onrender.com/api/v1/franchises/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { alert('Franchise Deleted.'); fetchFranchises(); } } catch (e) { console.error(e); } };
    const promptAdminAction = (actionType, targetObj) => { setPasswordPrompt({ isOpen: true, action: { type: actionType, target: targetObj }, password: '' }); };
    
    const handleVerifyPassword = async (e) => { e.preventDefault(); try { const res = await fetch('https://g-trams-web2.onrender.com/api/v1/auth/verify-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ password: passwordPrompt.password }) }); if (res.ok) { const { action } = passwordPrompt; setPasswordPrompt({ isOpen: false, action: null, password: '' }); if (action.type === 'delete') { executeDeleteUser(action.target._id); } else if (action.type === 'edit') { setUserFormData({ name: action.target.name, email: action.target.email, role: action.target.role, address: action.target.address || '' }); setUserModal({ isOpen: true, mode: 'edit', data: action.target }); } else if (action.type === 'deleteFranchise') { executeDeleteFranchise(action.target._id); } else if (action.type === 'editFranchise') { openEditModal(action.target); } } else { alert('Incorrect Admin Password.'); } } catch (e) { console.error(e); } };
    const executeDeleteUser = async (id) => { try { const res = await fetch(`https://g-trams-web2.onrender.com/api/v1/auth/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }); if (res.ok) { alert('User deleted.'); fetchUsers(); } } catch (e) { console.error(e); } };
    const handleSaveUser = async (e) => { e.preventDefault(); try { const res = await fetch(`https://g-trams-web2.onrender.com/api/v1/auth/${userModal.data._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(userFormData) }); if (res.ok) { alert('Updated!'); setUserModal({ isOpen: false, mode: 'view', data: null }); fetchUsers(); } } catch (e) { console.error(e); } };
    
    const getExpiryDate = (dateApplied) => { if (!dateApplied) return 'N/A'; const applied = new Date(dateApplied); return new Date(applied.setFullYear(applied.getFullYear() + 1)).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); };
    const checkExpiryStatus = (dateApplied) => { const applied = new Date(dateApplied); const diffDays = Math.ceil((new Date(applied.setFullYear(applied.getFullYear() + 1)) - new Date()) / (1000 * 60 * 60 * 24)); if (diffDays < 0) return { label: 'Expired', color: 'var(--color-danger)' }; if (diffDays <= 30) return { label: 'Expiring Soon', color: 'var(--color-warning)' }; return { label: 'Valid', color: 'var(--color-success)' }; };
    const handlePrintPermit = (franchise) => { const printContent = document.getElementById(`print-permit-${franchise._id}`); const originalBody = document.body.innerHTML; document.body.innerHTML = printContent.innerHTML; window.print(); document.body.innerHTML = originalBody; window.location.reload(); };

    // data processing for analytics
    const analyticsFiltered = franchises.filter(f => { if (analyticsMonth === 'All') return true; const date = new Date(f.dateApplied || f.createdAt); return date.getMonth().toString() === analyticsMonth; });
    const uniqueTodas = ['All', ...new Set(franchises.map(f => f.todaName))];
    const todaChartData = [...new Set(analyticsFiltered.map(f => f.todaName))].map(toda => ({ name: toda, value: analyticsFiltered.filter(f => f.todaName === toda).length })).filter(d => d.value > 0);
    const statusChartData = [ { name: 'Active', count: analyticsFiltered.filter(f => f.status === 'Active').length }, { name: 'Pending', count: analyticsFiltered.filter(f => f.status === 'Pending').length }, { name: 'Expired', count: analyticsFiltered.filter(f => f.status === 'Expired').length }, { name: 'Cancelled', count: analyticsFiltered.filter(f => f.status === 'Cancelled').length } ].filter(d => d.count > 0); 
    const typeChartData = [ { name: 'New App', value: analyticsFiltered.filter(f => f.applicationType === 'New').length }, { name: 'Renewal', value: analyticsFiltered.filter(f => f.applicationType === 'Renewal').length } ].filter(d => d.value > 0);
    const getMonthName = (monthValue) => { if (monthValue === 'All') return 'All Time'; const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; return months[parseInt(monthValue)]; };

    // Rule 5: Strict Semantic Colors for Charts
    const COLORS = ['var(--color-brand)', 'var(--color-brand-dark)', '#3b82f6', 'var(--color-warning)', 'var(--color-text-muted)'];
    const TYPE_COLORS = ['#3b82f6', 'var(--color-brand)']; 
    
    const filteredFranchises = franchises.filter(f => { const searchMatch = (f.operator?.name.toLowerCase().includes(searchTerm.toLowerCase())) || (f.plateNo.toLowerCase().includes(searchTerm.toLowerCase())); return searchMatch && (filterToda === 'All' ? true : f.todaName === filterToda); });
    const sortedFranchises = [...filteredFranchises].sort((a, b) => (a.status === 'Pending' ? -1 : 1));

    // loading screen view
    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--color-canvas)' }}>
                <img src={loadingGif} alt="Loading..." style={{ width: '150px', height: 'auto', objectFit: 'contain' }} />
                <h3 style={{ color: 'var(--color-brand-dark)', marginTop: '1rem' }}>Loading G-TRAMS Data...</h3>
                <p className="text-muted text-sm">Please wait while we connect to the server.</p>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            
            {/* mobile header */}
            {isMobile && (
                <div className="mobile-header no-print">
                    <div className="flex-row gap-1" style={{ alignItems: 'center' }}>
                        <h3 className="m-0" style={{ fontSize: 'var(--text-lg)' }}>G-TRAMS Admin</h3>
                    </div>
                    {/* Rule 3: Replaced text entity emoji with clean SVG */}
                    <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                </div>
            )}

            {isMobile && <div className={`mobile-overlay no-print ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>}

            {/* sidebar */}
            <div className={`sidebar-container no-print ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-title flex-column gap-1" style={{ alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-canvas)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--color-brand)' }}>
                        <img src={usersIcon} style={{ width: '40px', opacity: 0.6 }} alt="Admin" />
                    </div>
                    <h3 className="m-0 text-center" style={{ fontSize: 'var(--text-md)', color: 'var(--color-text-primary)' }}>Admin Portal</h3>
                </div>

                <div className="flex-column gap-1" style={{ padding: '0 1rem' }}>
                    <button className={`nav-button ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => switchTab('admin')}><img src={dashboardIcon} width="20" height="20" alt="Dashboard" style={{marginRight: '8px'}} /> Dashboard</button>
                    <button className={`nav-button ${activeTab === 'masterlist' ? 'active' : ''}`} onClick={() => switchTab('masterlist')}><img src={masterlistIcon} width="20" height="20" alt="Masterlist" style={{marginRight: '8px'}} /> Franchise Masterlist</button>
                    <button className={`nav-button ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => switchTab('calendar')}><img src={scheduleIcon} width="20" height="20" alt="Schedule" style={{marginRight: '8px'}} /> Signing Schedule</button>
                    <button className={`nav-button ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => switchTab('reports')}><img src={analyticsIcon} width="20" height="20" alt="Reports" style={{marginRight: '8px'}} /> Feedback Desk</button>
                    <button className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => switchTab('analytics')}><img src={analyticsIcon} width="20" height="20" alt="Analytics" style={{marginRight: '8px'}} /> Analytics</button>
                    <button className={`nav-button ${activeTab === 'users' ? 'active' : ''}`} onClick={() => switchTab('users')}><img src={usersIcon} width="20" height="20" alt="Users" style={{marginRight: '8px'}} /> User Management</button>
                </div>
                <div style={{ flex: 1 }}></div>
                <div style={{ padding: '1rem' }}>
                    <button className="btn-danger w-100" onClick={handleLogout}>Log Out</button>
                </div>
            </div>

            {/* main content area */}
            <div className="content-container">
                
                {/* admin overview */}
                {activeTab === 'admin' && (
                    <div className="flex-column gap-2">
                        <h2 className="m-0 text-primary no-print dashboard-title">Dashboard Overview</h2>
                        
                        <div className="main-grid no-print">
                            <div className="card flex-column text-center" style={{ borderTop: '4px solid var(--color-brand)' }}>
                                <h3 className="m-0 text-primary" style={{ fontSize: 'var(--text-3xl)' }}>{franchises.filter(f => f.status === 'Active').length}</h3>
                                <p className="text-muted m-0 mt-1 font-bold text-sm" style={{ textTransform: 'uppercase' }}>Active Units</p>
                            </div>
                            <div className="card flex-column text-center" style={{ borderTop: '4px solid #3b82f6' }}>
                                <h3 className="m-0" style={{ fontSize: 'var(--text-3xl)', color: '#3b82f6' }}>{franchises.filter(f => f.applicationType === 'New').length}</h3>
                                <p className="text-muted m-0 mt-1 font-bold text-sm" style={{ textTransform: 'uppercase' }}>New Apps</p>
                            </div>
                            <div className="card flex-column text-center" style={{ borderTop: '4px solid var(--color-warning)' }}>
                                <h3 className="m-0 text-warning" style={{ fontSize: 'var(--text-3xl)' }}>{franchises.filter(f => f.status === 'Pending').length}</h3>
                                <p className="text-muted m-0 mt-1 font-bold text-sm" style={{ textTransform: 'uppercase' }}>Pending</p>
                            </div>
                        </div>

                        <div className="main-grid no-print">
                            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                    <h3 className="m-0">Recent Applications</h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="m-0 mt-0">
                                        <thead><tr><th>Operator</th><th>Plate No.</th><th>Status</th><th className="text-center">Action</th></tr></thead>
                                        <tbody>
                                            {[...franchises].sort((a,b) => (a.status === 'Pending' ? -1 : 1)).slice(0, 6).map(f => (
                                                <tr key={f._id}>
                                                    <td className="font-bold">{f.operator?.name || 'Unknown'}</td>
                                                    <td>{f.plateNo}</td>
                                                    <td><span className={`badge ${f.status.toLowerCase()}`}>{f.status}</span></td>
                                                    <td className="text-center">
                                                        {f.status === 'Pending' ? (<button onClick={() => openViewModal(f)} className="btn-primary">Review</button>) : (<span className="text-muted text-sm">Masterlist</span>)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="card flex-column">
                                <h3 className="m-0 mb-1">System History</h3>
                                <div style={{ flex: 1, maxHeight: '400px', overflowY: 'auto', paddingRight: '10px' }} className="flex-column gap-1">
                                    {historyLogs.length > 0 ? historyLogs.map((log) => (
                                        <div key={log.id} className="list-item-card" style={{ borderLeft: `4px solid ${log.color}` }}>
                                            <div className="flex-between">
                                                <p className="font-bold m-0" style={{ color: log.color, fontSize: 'var(--text-sm)' }}>{log.title}</p>
                                                <span className="text-muted text-sm">{log.date.toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-muted m-0 mt-1 text-sm">{log.desc}</p>
                                        </div>
                                    )) : (<p className="text-muted text-center mt-2">No recent activity.</p>)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* masterlist */}
                {activeTab === 'masterlist' && (
                    <div className="flex-column gap-2">
                        <div className="flex-between flex-wrap gap-2 no-print">
                            <h2 className="m-0 text-primary dashboard-title">Franchise Master List</h2>
                            <div className="flex-row flex-wrap gap-1" style={{ alignItems: 'center' }}>
                                <button onClick={() => window.print()} className="flex-row gap-1" style={{ backgroundColor: 'var(--color-text-secondary)' }}>
                                    <img src={printerIcon} width="16" height="16" style={{ filter: 'brightness(0) invert(1)' }} alt="Print" /> Print
                                </button>
                                <button onClick={openAddModal} className="btn-success">Add</button>
                                <select value={filterToda} onChange={(e) => setFilterToda(e.target.value)} style={{ width: 'auto', margin: 0 }}>
                                    {uniqueTodas.map(toda => <option key={toda} value={toda}>{toda === 'All' ? 'Filter by TODA (All)' : toda}</option>)}
                                </select>
                                <div className="flex-row" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)' }}>
                                    <img src={searchIcon} width="16" style={{ opacity: 0.5, marginRight: '8px' }} alt="Search" />
                                    <input type="text" placeholder="Search Plate/Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', margin: 0, padding: 0, outline: 'none', width: '150px', boxShadow: 'none' }} />
                                </div>
                            </div>
                        </div>

                        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                            <table className="m-0 mt-0" style={{ minWidth: '800px' }}>
                                <thead><tr><th>Operator Details</th><th>Plate No.</th><th>TODA</th><th>Status</th><th>Validity</th><th className="text-center no-print">Actions</th></tr></thead>
                                <tbody>
                                    {sortedFranchises.map(franchise => {
                                        const expiryInfo = checkExpiryStatus(franchise.dateApplied);
                                        return (
                                            <tr key={franchise._id}>
                                                <td>
                                                    <div className="font-bold">{franchise.operator?.name || 'Unknown'}</div>
                                                    <div className="text-muted text-sm">{franchise.operator?.email}</div>
                                                </td>
                                                <td className="font-bold">{franchise.plateNo}</td>
                                                <td>{franchise.todaName}</td>
                                                <td><span className={`badge ${franchise.status.toLowerCase()}`}>{franchise.status}</span></td>
                                                <td>
                                                    <span style={{ display: 'block', fontWeight: '600' }}>{getExpiryDate(franchise.dateApplied)}</span>
                                                    <span style={{ display: 'block', color: expiryInfo.color, fontSize: 'var(--text-xs)', marginTop: '2px', fontWeight: '500' }}>{expiryInfo.label}</span>
                                                </td>
                                                <td className="no-print">
                                                    <div className="flex-row gap-1" style={{ justifyContent: 'center' }}>
                                                        <button onClick={() => openViewModal(franchise)} className="btn-primary">{franchise.status === 'Pending' ? 'Review' : 'View'}</button>
                                                        <button onClick={() => promptAdminAction('editFranchise', franchise)} className="btn-warning">Edit</button>
                                                        <button onClick={() => promptAdminAction('deleteFranchise', franchise)} className="btn-danger">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {sortedFranchises.length === 0 && <div className="text-center text-muted" style={{ padding: '2rem' }}>No records found.</div>}
                        </div>
                    </div>
                )}

                {/* feedback desk */}
                {activeTab === 'reports' && (
                    <div className="flex-column gap-2">
                        <div className="flex-between flex-wrap gap-1 mb-1">
                            <h2 className="m-0 text-primary dashboard-title">Feedback & Support Desk</h2>
                            <span className="badge" style={{ backgroundColor: '#fef3c7', color: '#d97706', fontSize: 'var(--text-sm)' }}>Total Tickets: {reports.length}</span>
                        </div>
                        
                        <div className="flex-column gap-2">
                            {reports.length === 0 ? <div className="card text-center text-muted">No reports or feedback received.</div> : reports.map(r => (
                                <div key={r._id} className="card flex-column gap-2" style={{ borderLeft: `6px solid ${r.status === 'Resolved' ? 'var(--color-brand)' : 'var(--color-danger)'}` }}>
                                    
                                    <div className="flex-between flex-wrap gap-1" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '10px' }}>
                                        <div className="flex-row gap-1" style={{ alignItems: 'center' }}>
                                            {r.operator?.profilePic ? <img src={getImageUrl(r.operator.profilePic)} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--color-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={usersIcon} style={{ width: '20px', opacity: 0.5 }} alt="Default" /></div>}
                                            <div>
                                                <strong style={{ display: 'block' }}>{r.operator?.name || 'Unknown Operator'}</strong>
                                                <span className="text-muted text-sm">{new Date(r.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <span className={`badge ${r.status === 'Resolved' ? 'active' : 'expired'}`}>{r.status}</span>
                                    </div>
                                    
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0' }}>{r.subject}</h4>
                                        <p className="m-0 text-muted">{r.message}</p>
                                    </div>

                                    {/* Rule 1: Inner element uses distinct surface overlay */}
                                    {r.response ? (
                                        <div className="list-item-card" style={{ borderLeft: '4px solid #3b82f6', marginTop: '0.5rem' }}>
                                            <p className="text-sm font-bold" style={{ margin: '0 0 0.2rem 0', color: '#3b82f6', textTransform: 'uppercase' }}>Admin Reply:</p>
                                            <p className="m-0 text-sm">{r.response}</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                            <button onClick={() => setReplyModal({ isOpen: true, reportId: r._id, responseText: '' })} className="btn-primary">Write Reply</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* detailed analytics */}
                {activeTab === 'analytics' && (
                    <div className="flex-column gap-2">
                        <div className="print-header" style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                            <h2 className="text-center mb-1">Municipality of Gasan</h2>
                            <h3 className="text-center text-muted m-0">Tricycle Franchise Analytics Report</h3>
                            <p className="text-center mt-1">Period: {getMonthName(analyticsMonth)}</p>
                        </div>

                        <div className="flex-between mb-1 no-print flex-wrap gap-2">
                            <h2 className="m-0 text-primary dashboard-title">Data Analytics</h2>
                            <div className="flex-row gap-1 flex-wrap" style={{ alignItems: 'center' }}>
                                <button onClick={() => window.print()} className="flex-row gap-1" style={{ backgroundColor: 'var(--color-text-secondary)' }}>
                                    <img src={printerIcon} width="16" height="16" style={{ filter: 'brightness(0) invert(1)' }} alt="Print" /> Print Report
                                </button>
                                <div className="flex-row" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                    <span style={{ padding: '0.6rem 1rem', backgroundColor: 'var(--color-overlay)', borderRight: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', fontWeight: '500' }}>Period</span>
                                    <select value={analyticsMonth} onChange={(e) => setAnalyticsMonth(e.target.value)} style={{ border: 'none', margin: 0, width: 'auto', borderRadius: 0, boxShadow: 'none' }}>
                                        <option value="All">All Time</option><option value="0">Jan</option><option value="1">Feb</option><option value="2">Mar</option><option value="3">Apr</option><option value="4">May</option><option value="5">Jun</option><option value="6">Jul</option><option value="7">Aug</option><option value="8">Sep</option><option value="9">Oct</option><option value="10">Nov</option><option value="11">Dec</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="main-grid">
                            <div className="card text-center" style={{ borderTop: '4px solid #3b82f6' }}>
                                <h3 className="m-0" style={{ fontSize: 'var(--text-3xl)', color: '#3b82f6' }}>{analyticsFiltered.length}</h3>
                                <p className="font-bold text-muted m-0 mt-1 text-sm" style={{ textTransform: 'uppercase' }}>Total Applications</p>
                            </div>
                            <div className="card text-center" style={{ borderTop: '4px solid var(--color-brand)' }}>
                                <h3 className="m-0 text-primary" style={{ fontSize: 'var(--text-3xl)' }}>{analyticsFiltered.filter(f => f.status === 'Active').length}</h3>
                                <p className="font-bold text-muted m-0 mt-1 text-sm" style={{ textTransform: 'uppercase' }}>Total Active</p>
                            </div>
                            <div className="card text-center" style={{ borderTop: '4px solid var(--color-danger)' }}>
                                <h3 className="m-0 text-danger" style={{ fontSize: 'var(--text-3xl)' }}>{analyticsFiltered.filter(f => f.status === 'Cancelled').length}</h3>
                                <p className="font-bold text-muted m-0 mt-1 text-sm" style={{ textTransform: 'uppercase' }}>Cancelled or Declined</p>
                            </div>
                        </div>

                        {analyticsFiltered.length === 0 ? (
                            <div className="card text-center"><p className="text-muted m-0">No data recorded for this period.</p></div>
                        ) : (
                            <div className="main-grid">
                                <div className="card flex-column" style={{ pageBreakInside: 'avoid', minWidth: 0 }}>
                                    <h3 className="text-center mb-1">Franchises Per TODA</h3>
                                    <div style={{ height: '300px', width: '100%' }}>
                                        <ResponsiveContainer width="99%" height="100%">
                                            <PieChart>
                                                <Pie data={todaChartData} cx="50%" cy="45%" outerRadius={90} dataKey="value" label>
                                                    {todaChartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-sm)' }} />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.8rem' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card flex-column" style={{ pageBreakInside: 'avoid', minWidth: 0 }}>
                                    <h3 className="text-center mb-1">Application Types</h3>
                                    <div style={{ height: '300px', width: '100%' }}>
                                        <ResponsiveContainer width="99%" height="100%">
                                            <PieChart>
                                                <Pie data={typeChartData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} dataKey="value" label>
                                                    {typeChartData.map((e, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-sm)' }} />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.8rem' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="card flex-column span-2" style={{ pageBreakInside: 'avoid', minWidth: 0 }}>
                                    <h3 className="mb-1">Application Status Overview</h3>
                                    <div style={{ height: '350px', width: '100%' }}>
                                        <ResponsiveContainer width="99%" height="100%">
                                            <BarChart data={statusChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: '0.85rem' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: '0.85rem' }} dx={-10} />
                                                <RechartsTooltip cursor={{ fill: 'var(--color-overlay)' }} contentStyle={{ borderRadius: 'var(--radius-md)', border: 'none', boxShadow: 'var(--shadow-sm)' }} />
                                                <Bar dataKey="count" fill="var(--color-brand)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* calendar */}
                {activeTab === 'calendar' && (
                    <div className="flex-column gap-2">
                        <h2 className="m-0 text-primary dashboard-title">Office Schedule</h2>
                        <div className="main-grid">
                            <div className="card flex-column">
                                <h3 className="mb-1">Create Schedule</h3>
                                <form onSubmit={handleAddEvent} className="flex-column gap-1">
                                    <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Date</label><input type="date" value={calendarForm.date} onChange={(e) => setCalendarForm({...calendarForm, date: e.target.value})} required /></div>
                                    <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Status</label><select value={calendarForm.status} onChange={(e) => setCalendarForm({...calendarForm, status: e.target.value})} required><option value="Available">Available</option><option value="E-Sign Mode">E-Sign Mode</option><option value="Unavailable">Unavailable</option></select></div>
                                    <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Note / Remarks</label><input type="text" value={calendarForm.note} onChange={(e) => setCalendarForm({...calendarForm, note: e.target.value})} placeholder="Ex. Mayor is out of town" required /></div>
                                    <button type="submit" className="btn-primary mt-1">Save Schedule</button>
                                </form>
                            </div>
                            <div className="card flex-column">
                                <h3 className="mb-1">Upcoming Schedules</h3>
                                <div className="flex-column gap-1" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                    {calendarEvents.length === 0 ? <p className="text-muted text-center">No schedules created.</p> : calendarEvents.map(ev => (
                                        <div key={ev._id} className="list-item-card flex-between" style={{ borderLeft: `5px solid ${ev.status === 'Available' ? 'var(--color-brand)' : ev.status === 'E-Sign Mode' ? 'var(--color-warning)' : 'var(--color-danger)'}` }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.3rem 0' }}>{ev.date}</h4>
                                                <span className="text-xs font-bold" style={{ textTransform: 'uppercase', color: ev.status === 'Available' ? 'var(--color-brand)' : ev.status === 'E-Sign Mode' ? 'var(--color-warning)' : 'var(--color-danger)' }}>{ev.status}</span>
                                                <p className="m-0 mt-1 text-muted text-sm">{ev.note}</p>
                                            </div>
                                            <button onClick={() => handleDeleteEvent(ev._id)} className="btn-danger">Delete</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* users */}
                {activeTab === 'users' && (
                    <div className="flex-column gap-2">
                        <div className="flex-between mb-1 flex-wrap gap-1">
                            <h2 className="m-0 text-primary dashboard-title">System Users Management</h2>
                            <span className="badge" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}>Total Accounts: {users.length}</span>
                        </div>
                        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                            <table className="m-0 mt-0" style={{ minWidth: '700px' }}>
                                <thead><tr><th className="text-center">Profile</th><th>Full Name</th><th>Email Address</th><th>Account Role</th><th className="text-center">Actions</th></tr></thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user._id}>
                                            <td style={{ display: 'flex', justifyContent: 'center' }}>
                                                {user.profilePic ? (<img src={getImageUrl(user.profilePic)} alt="Profile" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} />) : (<div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'var(--color-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={usersIcon} style={{ width: '24px', opacity: 0.4 }} alt="Default" /></div>)}
                                            </td>
                                            <td className="font-bold">{user.name}</td>
                                            <td className="text-muted">{user.email}</td>
                                            <td><span className={`badge ${user.role === 'admin' ? 'expired' : 'active'}`} style={{ textTransform: 'uppercase' }}>{user.role}</span></td>
                                            <td>
                                                <div className="flex-row gap-1" style={{ justifyContent: 'center' }}>
                                                    <button onClick={() => setUserModal({ isOpen: true, mode: 'view', data: user })} className="btn-primary">View</button>
                                                    <button onClick={() => promptAdminAction('edit', user)} className="btn-warning">Edit</button>
                                                    <button onClick={() => promptAdminAction('delete', user)} className="btn-danger">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {replyModal.isOpen && ( 
                <div className="modal-overlay">
                    <div className="modal-content modal-md">
                        {/* Rule 3: Replaced text emoji times entity with proper SVG */}
                        <button onClick={() => setReplyModal({ isOpen: false, reportId: null, responseText: '' })} className="modal-close-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <h2 className="mt-0">Respond to Ticket</h2>
                        <form onSubmit={handleAdminReply}>
                            <textarea rows="5" value={replyModal.responseText} onChange={(e) => setReplyModal({...replyModal, responseText: e.target.value})} placeholder="Type your response here. The operator will see this..." required></textarea>
                            <button type="submit" className="btn-success w-100 mt-1">Submit Reply & Resolve</button>
                        </form>
                    </div>
                </div> 
            )}
            
            {showFormModal && ( 
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: '700px' }}>
                        <div className="flex-between mb-2" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                            <h2 className="m-0">{editingId ? 'Edit Franchise Record' : 'Register New Franchise'}</h2>
                            <button onClick={() => setShowFormModal(false)} className="modal-close-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSaveFranchise}>
                            <div className="form-grid">
                                <div className="span-2">
                                    <label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Select Operator</label>
                                    <select name="operator" value={formData.operator} onChange={handleFormChange} required><option value="" disabled>Choose operator from users...</option>{users.filter(u => u.role === 'operator').map(user => <option key={user._id} value={user._id}>{user.name}</option>)}</select>
                                </div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>TODA Name</label><input type="text" name="todaName" value={formData.todaName} onChange={handleFormChange} required /></div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Operating Zone</label><input type="text" name="zone" value={formData.zone} onChange={handleFormChange} required /></div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Plate Number</label><input type="text" name="plateNo" value={formData.plateNo} onChange={handleFormChange} required /></div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Year Made</label><input type="text" name="made" value={formData.made} onChange={handleFormChange} required /></div>
                                <div className="span-2"><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Brand / Make</label><input type="text" name="make" value={formData.make} onChange={handleFormChange} required /></div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Motor Number</label><input type="text" name="motorNo" value={formData.motorNo} onChange={handleFormChange} required /></div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Chassis Number</label><input type="text" name="chassisNo" value={formData.chassisNo} onChange={handleFormChange} required /></div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Application Type</label><select name="applicationType" value={formData.applicationType} onChange={handleFormChange}><option value="New">New Application</option><option value="Renewal">Renewal</option></select></div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Initial Status</label><select name="status" value={formData.status} onChange={handleFormChange}><option value="Active">Active</option><option value="Pending">Pending</option><option value="Expired">Expired</option><option value="Cancelled">Cancelled</option></select></div>
                            </div>
                            <div className="flex-row gap-2 mt-2">
                                <button type="button" onClick={() => setShowFormModal(false)} className="w-100" style={{ backgroundColor: 'var(--color-overlay)', color: 'var(--color-text-primary)' }}>Cancel</button>
                                <button type="submit" className="btn-primary w-100">Save Franchise</button>
                            </div>
                        </form>
                    </div>
                </div> 
            )}
            
            {selectedFranchise && ( 
                <div className="modal-overlay no-print">
                    <div className="modal-content" style={{ maxWidth: '800px' }}>
                        <div className="flex-between mb-2 flex-wrap" style={{ borderBottom: '2px solid var(--color-border)', paddingBottom: '1rem', alignItems: 'flex-start' }}>
                            <div>
                                <h2 className="m-0 mb-1">{selectedFranchise.status === 'Pending' ? 'Review Application' : 'Franchise Details'}</h2>
                                <div className="flex-row flex-wrap gap-1" style={{ alignItems: 'center' }}>
                                    <span className={`badge ${selectedFranchise.status.toLowerCase()}`}>{selectedFranchise.status}</span>
                                    <span className="badge" style={{ backgroundColor: 'var(--color-overlay)' }}>{selectedFranchise.applicationType} App</span>
                                    <span className="badge expired">Valid Until: {getExpiryDate(selectedFranchise.dateApplied)}</span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedFranchise(null)} className="modal-close-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <div className="main-grid">
                            <div className="list-item-card" style={{ borderLeft: '4px solid var(--color-brand)' }}>
                                <h4 className="text-primary text-sm mb-1" style={{ textTransform: 'uppercase' }}>Operator Information</h4>
                                <p className="m-0 text-sm mb-1"><strong>Name:</strong> {selectedFranchise.operator?.name}</p>
                                <p className="m-0 text-sm"><strong>Email:</strong> {selectedFranchise.operator?.email}</p>
                            </div>
                            <div className="list-item-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                                <h4 className="text-sm mb-1" style={{ color: '#3b82f6', textTransform: 'uppercase' }}>Tricycle Specifications</h4>
                                <div className="form-grid gap-1">
                                    {/* Rule 4: Removed em dashes */}
                                    <p className="m-0 text-sm"><strong className="text-muted text-xs mb-1" style={{ display: 'block', textTransform: 'uppercase' }}>Plate No</strong> {selectedFranchise.plateNo}</p>
                                    <p className="m-0 text-sm"><strong className="text-muted text-xs mb-1" style={{ display: 'block', textTransform: 'uppercase' }}>TODA: Zone</strong> {selectedFranchise.todaName}: {selectedFranchise.zone}</p>
                                    <p className="m-0 text-sm"><strong className="text-muted text-xs mb-1" style={{ display: 'block', textTransform: 'uppercase' }}>Unit</strong> {selectedFranchise.make} {selectedFranchise.made}</p>
                                    <p className="m-0 text-sm"><strong className="text-muted text-xs mb-1" style={{ display: 'block', textTransform: 'uppercase' }}>Motor / Chassis</strong> {selectedFranchise.motorNo} / {selectedFranchise.chassisNo}</p>
                                </div>
                            </div>
                            <div className="list-item-card span-2" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                                <h4 className="text-warning text-sm mb-1" style={{ textTransform: 'uppercase' }}>Submitted Documents</h4>
                                <div className="form-grid gap-1 mb-1">
                                    <p className="m-0 text-sm"><strong className="text-muted text-xs mb-1" style={{ display: 'block', textTransform: 'uppercase' }}>Cedula CTC No.</strong> {selectedFranchise.cedulaSerialNo || 'N/A'}</p>
                                    <p className="m-0 text-sm"><strong className="text-muted text-xs mb-1" style={{ display: 'block', textTransform: 'uppercase' }}>Date & Place Issued</strong> {selectedFranchise.cedulaDate ? new Date(selectedFranchise.cedulaDate).toLocaleDateString() : 'N/A'}: {selectedFranchise.cedulaAddress || 'N/A'}</p>
                                </div>
                                {selectedFranchise.orCrUrl && (
                                    <div>
                                        <strong className="text-muted text-xs mb-1" style={{ display: 'block', textTransform: 'uppercase' }}>OR/CR Uploaded File</strong>
                                        {selectedFranchise.orCrUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)', display: 'flex', justifyContent: 'center', padding: '1rem' }}>
                                                <img src={getImageUrl(selectedFranchise.orCrUrl)} alt="OR/CR Document" style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain' }} />
                                            </div>
                                        ) : (
                                            <a href={getImageUrl(selectedFranchise.orCrUrl)} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>Open PDF Document</a>
                                        )}
                                    </div>
                                )}
                            </div>
                            
                            {selectedFranchise.status === 'Cancelled' && selectedFranchise.cancelReason && (
                                <div className="list-item-card span-2" style={{ backgroundColor: '#fee2e2', borderLeft: '4px solid var(--color-danger)' }}>
                                    <h4 className="text-danger text-sm mb-1" style={{ textTransform: 'uppercase' }}>Reason for Cancellation</h4>
                                    <p className="m-0 text-danger font-bold">"{selectedFranchise.cancelReason}"</p>
                                </div>
                            )}
                        </div>

                        {selectedFranchise.status !== 'Active' && (
                            <form onSubmit={handleAdvancedApproval} className="mt-2" style={{ padding: '1.5rem', backgroundColor: 'var(--color-overlay)', borderRadius: 'var(--radius-md)' }}>
                                <h4 className="m-0 mb-1">Admin Action Panel</h4>
                                <div className="form-grid mb-2">
                                    <div>
                                        <label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Update Status</label>
                                        <select value={viewModalData.status} onChange={(e) => setViewModalData({...viewModalData, status: e.target.value})}>
                                            <option value="Pending">Pending (Needs Review)</option>
                                            <option value="Active">Approve (Active)</option>
                                            <option value="Expired">Expired</option>
                                            <option value="Cancelled">Decline or Cancel</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Estimated Release Date</label>
                                        <input type="date" value={viewModalData.releaseDate} onChange={(e) => setViewModalData({...viewModalData, releaseDate: e.target.value})} />
                                    </div>
                                    <div className="span-2 flex-row gap-1" style={{ backgroundColor: 'var(--color-surface)', padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                        <input type="checkbox" id="esignCheck" checked={viewModalData.eSigned} onChange={(e) => setViewModalData({...viewModalData, eSigned: e.target.checked})} style={{ width: '20px', height: '20px', cursor: 'pointer', margin: 0 }} />
                                        <label htmlFor="esignCheck" style={{ cursor: 'pointer', userSelect: 'none' }} className="font-bold">Activate E-Signature (For absent officials)</label>
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary w-100">Save Action & Update Status</button>
                            </form>
                        )}
                        
                        {selectedFranchise.status === 'Active' && (
                            <button onClick={() => handlePrintPermit(selectedFranchise)} className="btn-success w-100 mt-2 flex-row" style={{ justifyContent: 'center' }}>
                                <img src={printerIcon} width="20" height="20" style={{ filter: 'brightness(0) invert(1)', marginRight: '8px' }} alt="Print" /> Print Official Franchise Permit
                            </button>
                        )}
                    </div>
                </div> 
            )}
            
            {passwordPrompt.isOpen && ( 
                <div className="modal-overlay" style={{ zIndex: 200 }}>
                    <div className="modal-content modal-md text-center">
                        <button onClick={() => setPasswordPrompt({ isOpen: false, action: null, password: '' })} className="modal-close-btn">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        <h2 className="m-0 mb-1">Security Verification</h2>
                        <p className="text-muted text-sm mb-2">Please verify your Admin Password to continue with this sensitive action.</p>
                        <form onSubmit={handleVerifyPassword}>
                            <input type="password" placeholder="Enter Admin Password..." value={passwordPrompt.password} onChange={(e) => setPasswordPrompt({...passwordPrompt, password: e.target.value})} required autoFocus style={{ textAlign: 'center', fontSize: 'var(--text-md)', letterSpacing: '0.2em' }} />
                            <button type="submit" className="btn-danger w-100 mt-1">Verify Identity</button>
                        </form>
                    </div>
                </div> 
            )}
            
            {userModal.isOpen && ( 
                <div className="modal-overlay">
                    <div className="modal-content modal-md">
                        <div className="flex-between mb-2" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                            <h2 className="m-0">{userModal.mode === 'edit' ? 'Edit User Details' : 'Account Overview'}</h2>
                            <button onClick={() => setUserModal({ isOpen: false, mode: 'view', data: null })} className="modal-close-btn">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        {userModal.mode === 'view' ? (
                            <div className="flex-column gap-1">
                                <div className="text-center mb-1">
                                    {userModal.data.profilePic ? (
                                        <img src={getImageUrl(userModal.data.profilePic)} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--color-surface)', boxShadow: 'var(--shadow-sm)' }} />
                                    ) : (
                                        <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--color-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid var(--color-surface)', boxShadow: 'var(--shadow-sm)', margin: '0 auto' }}>
                                            <img src={usersIcon} style={{ width: '50px', opacity: 0.4 }} alt="Default" />
                                        </div>
                                    )}
                                </div>
                                <div className="list-item-card">
                                    <p className="text-xs text-muted font-bold m-0 mb-1" style={{ textTransform: 'uppercase' }}>Full Name</p>
                                    <p className="m-0 font-bold" style={{ fontSize: 'var(--text-md)' }}>{userModal.data.name}</p>
                                </div>
                                <div className="list-item-card">
                                    <p className="text-xs text-muted font-bold m-0 mb-1" style={{ textTransform: 'uppercase' }}>Email Address</p>
                                    <p className="m-0 font-bold" style={{ fontSize: 'var(--text-md)' }}>{userModal.data.email}</p>
                                </div>
                                <div className="list-item-card flex-between">
                                    <p className="text-xs text-muted font-bold m-0" style={{ textTransform: 'uppercase' }}>Account Role</p>
                                    <span className={`badge ${userModal.data.role === 'admin' ? 'expired' : 'active'}`} style={{ textTransform: 'uppercase' }}>{userModal.data.role}</span>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleSaveUser} className="flex-column gap-1">
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Full Name</label><input type="text" value={userFormData.name} onChange={(e) => setUserFormData({...userFormData, name: e.target.value})} required /></div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Email Address</label><input type="email" value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} required /></div>
                                <div><label className="text-sm font-bold text-muted mb-1" style={{ display: 'block' }}>Account Role</label><select value={userFormData.role} onChange={(e) => setUserFormData({...userFormData, role: e.target.value})} required><option value="operator">Operator</option><option value="admin">Admin</option></select></div>
                                <div className="flex-row gap-2 mt-1">
                                    <button type="button" onClick={() => setUserModal({ isOpen: false, mode: 'view', data: null })} className="w-100" style={{ backgroundColor: 'var(--color-overlay)', color: 'var(--color-text-primary)' }}>Cancel</button>
                                    <button type="submit" className="btn-primary w-100">Save Changes</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div> 
            )}
        </div>
    );
}