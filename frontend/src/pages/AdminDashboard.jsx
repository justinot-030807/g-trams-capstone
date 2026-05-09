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
                    // fetch all data concurrently
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
                logs.push({ id: `f-upd-${f._id}`, title: `Franchise: ${f.plateNo}`, desc: `Status marked as ${f.status}`, date: new Date(f.updatedAt || f.dateApplied), color: f.status === 'Active' ? '#2FA084' : f.status === 'Pending' ? '#f59e0b' : '#ef4444' });
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
    const checkExpiryStatus = (dateApplied) => { const applied = new Date(dateApplied); const diffDays = Math.ceil((new Date(applied.setFullYear(applied.getFullYear() + 1)) - new Date()) / (1000 * 60 * 60 * 24)); if (diffDays < 0) return { label: 'Expired', color: 'var(--danger)' }; if (diffDays <= 30) return { label: 'Expiring Soon', color: 'var(--warning)' }; return { label: 'Valid', color: 'var(--success)' }; };
    const handlePrintPermit = (franchise) => { const printContent = document.getElementById(`print-permit-${franchise._id}`); const originalBody = document.body.innerHTML; document.body.innerHTML = printContent.innerHTML; window.print(); document.body.innerHTML = originalBody; window.location.reload(); };

    // data processing for analytics
    const analyticsFiltered = franchises.filter(f => { if (analyticsMonth === 'All') return true; const date = new Date(f.dateApplied || f.createdAt); return date.getMonth().toString() === analyticsMonth; });
    const uniqueTodas = ['All', ...new Set(franchises.map(f => f.todaName))];
    const todaChartData = [...new Set(analyticsFiltered.map(f => f.todaName))].map(toda => ({ name: toda, value: analyticsFiltered.filter(f => f.todaName === toda).length })).filter(d => d.value > 0);
    const statusChartData = [ { name: 'Active', count: analyticsFiltered.filter(f => f.status === 'Active').length }, { name: 'Pending', count: analyticsFiltered.filter(f => f.status === 'Pending').length }, { name: 'Expired', count: analyticsFiltered.filter(f => f.status === 'Expired').length }, { name: 'Cancelled', count: analyticsFiltered.filter(f => f.status === 'Cancelled').length } ].filter(d => d.count > 0); 
    const typeChartData = [ { name: 'New App', value: analyticsFiltered.filter(f => f.applicationType === 'New').length }, { name: 'Renewal', value: analyticsFiltered.filter(f => f.applicationType === 'Renewal').length } ].filter(d => d.value > 0);
    const getMonthName = (monthValue) => { if (monthValue === 'All') return 'All Time'; const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']; return months[parseInt(monthValue)]; };

    const COLORS = ['#1F6F5F', '#2FA084', '#6FCF97', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#ec4899'];
    const TYPE_COLORS = ['#3b82f6', '#8b5cf6']; 
    const filteredFranchises = franchises.filter(f => { const searchMatch = (f.operator?.name.toLowerCase().includes(searchTerm.toLowerCase())) || (f.plateNo.toLowerCase().includes(searchTerm.toLowerCase())); return searchMatch && (filterToda === 'All' ? true : f.todaName === filterToda); });
    const sortedFranchises = [...filteredFranchises].sort((a, b) => (a.status === 'Pending' ? -1 : 1));

    // modern ui styles
    const modernCard = { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', border: '1px solid #f1f5f9' };
    const modernTableWrapper = { overflowX: 'auto', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #e2e8f0', WebkitOverflowScrolling: 'touch' };
    const thStyle = { backgroundColor: '#f8fafc', padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #e2e8f0', whiteSpace: 'nowrap' };
    const tdStyle = { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '0.9rem', whiteSpace: 'nowrap' };
    const actionBtn = { padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px', fontWeight: '500', transition: 'all 0.2s', cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' };
    const closeBtnStyle = { fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '3px', cursor: 'pointer', border: 'none', background: 'none', color: '#64748b' };

    // loading screen view
    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f8fafc' }}>
                <img src={loadingGif} alt="Loading..." style={{ width: '150px', height: 'auto', objectFit: 'contain' }} />
                <h3 style={{ color: '#1F6F5F', marginTop: '1rem', fontFamily: 'sans-serif' }}>Loading G-TRAMS Data...</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Please wait while we connect to the server.</p>
            </div>
        );
    }

    return (
        <div className="admin-layout" style={{ backgroundColor: '#f8fafc', minHeight: '100vh', display: isMobile ? 'block' : 'flex' }}>
            
            {/* mobile header */}
            {isMobile && (
                <div className="mobile-header no-print" style={{ backgroundColor: '#1F6F5F', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div className="flex-row gap-1" style={{ alignItems: 'center' }}>
                        <h3 className="m-0" style={{ fontSize: '1.2rem', fontWeight: '600' }}>G-TRAMS Admin</h3>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.8rem', cursor: 'pointer' }}>&#9776;</button>
                </div>
            )}

            {isMobile && <div className={`mobile-overlay no-print ${isSidebarOpen ? 'open' : ''}`} onClick={() => setIsSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 40, display: isSidebarOpen ? 'block' : 'none' }}></div>}

            {/* sidebar */}
            <div className={`sidebar-container no-print ${isSidebarOpen ? 'open' : ''}`} style={{ backgroundColor: '#ffffff', boxShadow: '2px 0 8px rgba(0,0,0,0.05)', zIndex: 50, display: (!isMobile || isSidebarOpen) ? 'flex' : 'none', flexDirection: 'column', width: isMobile ? '250px' : '260px', height: '100vh', position: isMobile ? 'fixed' : 'sticky', top: 0, left: 0, transition: 'transform 0.3s ease' }}>
                <div className="sidebar-title flex-column gap-1" style={{ alignItems: 'center', marginBottom: '2rem', padding: '2rem 1rem 0' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #2FA084', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <img src={usersIcon} style={{ width: '40px', opacity: 0.6 }} alt="Admin" />
                    </div>
                    <h3 className="m-0 text-center" style={{ fontSize: '1.1rem', color: '#1e293b', fontWeight: '700' }}>Admin Portal</h3>
                </div>

                <div style={{ padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button className={`nav-button ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => switchTab('admin')} style={{ borderRadius: '8px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center' }}><img src={dashboardIcon} width="20" height="20" alt="Dashboard" style={{marginRight: '8px'}} /> Dashboard</button>
                    <button className={`nav-button ${activeTab === 'masterlist' ? 'active' : ''}`} onClick={() => switchTab('masterlist')} style={{ borderRadius: '8px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center' }}><img src={masterlistIcon} width="20" height="20" alt="Masterlist" style={{marginRight: '8px'}} /> Franchise Masterlist</button>
                    <button className={`nav-button ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => switchTab('calendar')} style={{ borderRadius: '8px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center' }}><img src={scheduleIcon} width="20" height="20" alt="Schedule" style={{marginRight: '8px'}} /> Signing Schedule</button>
                    <button className={`nav-button ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => switchTab('reports')} style={{ borderRadius: '8px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center' }}><img src={analyticsIcon} width="20" height="20" alt="Reports" style={{marginRight: '8px'}} /> Feedback Desk</button>
                    <button className={`nav-button ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => switchTab('analytics')} style={{ borderRadius: '8px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center' }}><img src={analyticsIcon} width="20" height="20" alt="Analytics" style={{marginRight: '8px'}} /> Analytics</button>
                    <button className={`nav-button ${activeTab === 'users' ? 'active' : ''}`} onClick={() => switchTab('users')} style={{ borderRadius: '8px', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center' }}><img src={usersIcon} width="20" height="20" alt="Users" style={{marginRight: '8px'}} /> User Management</button>
                </div>
                <div style={{ flex: 1 }}></div>
                <div style={{ padding: '1rem' }}>
                    <button className="btn-danger w-100" onClick={handleLogout} style={{ borderRadius: '8px', padding: '0.8rem', fontWeight: '600' }}>Log Out</button>
                </div>
            </div>

            {/* main content area */}
            <div className="content-container" style={{ flex: 1, padding: isMobile ? '1rem' : '2rem', maxWidth: '1400px', width: '100%', overflowX: 'hidden' }}>
                
                {/* admin overview */}
                {activeTab === 'admin' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h2 className="m-0 text-primary no-print" style={{ fontSize: '1.8rem' }}>Dashboard Overview</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }} className="no-print">
                            <div style={{...modernCard, borderTop: '4px solid #2FA084', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                <h3 className="m-0" style={{ fontSize: '2.5rem', color: '#2FA084', fontWeight: '700' }}>{franchises.filter(f => f.status === 'Active').length}</h3>
                                <p className="text-muted m-0 mt-1 font-bold" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>Active Units</p>
                            </div>
                            <div style={{...modernCard, borderTop: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                <h3 className="m-0" style={{ fontSize: '2.5rem', color: '#3b82f6', fontWeight: '700' }}>{franchises.filter(f => f.applicationType === 'New').length}</h3>
                                <p className="text-muted m-0 mt-1 font-bold" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>New Apps</p>
                            </div>
                            <div style={{...modernCard, borderTop: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                                <h3 className="m-0" style={{ fontSize: '2.5rem', color: '#f59e0b', fontWeight: '700' }}>{franchises.filter(f => f.status === 'Pending').length}</h3>
                                <p className="text-muted m-0 mt-1 font-bold" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>Pending</p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }} className="no-print">
                            <div style={{ ...modernCard, padding: '0', overflow: 'hidden' }}>
                                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                                    <h3 className="m-0" style={{ color: '#1e293b' }}>Recent Applications</h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '400px' }}>
                                        <thead><tr><th style={thStyle}>Operator</th><th style={thStyle}>Plate No.</th><th style={thStyle}>Status</th><th style={thStyle} className="text-center">Action</th></tr></thead>
                                        <tbody>
                                            {[...franchises].sort((a,b) => (a.status === 'Pending' ? -1 : 1)).slice(0, 6).map(f => (
                                                <tr key={f._id} style={{ transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                    <td style={{...tdStyle, fontWeight: '600'}}>{f.operator?.name || 'Unknown'}</td><td style={tdStyle}>{f.plateNo}</td>
                                                    <td style={tdStyle}><span className={`badge ${f.status.toLowerCase()}`}>{f.status}</span></td>
                                                    <td style={tdStyle} className="text-center">
                                                        {f.status === 'Pending' ? (<button onClick={() => openViewModal(f)} className="btn-primary" style={{...actionBtn, margin: '0 auto'}}>Review</button>) : (<span className="text-muted" style={{ fontSize: '0.8rem' }}>Masterlist</span>)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div style={{ ...modernCard, display: 'flex', flexDirection: 'column' }}>
                                <h3 className="m-0 mb-1" style={{ color: '#1e293b' }}>System History</h3>
                                <div style={{ flex: 1, maxHeight: '400px', overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {historyLogs.length > 0 ? historyLogs.map((log) => (
                                        <div key={log.id} style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', borderLeft: `4px solid ${log.color}` }}>
                                            <div className="flex-between"><p className="font-bold m-0" style={{ color: log.color, fontSize: '0.9rem' }}>{log.title}</p><span className="text-muted" style={{ fontSize: '0.75rem' }}>{log.date.toLocaleDateString()}</span></div>
                                            <p className="text-muted m-0 mt-1" style={{ fontSize: '0.85rem' }}>{log.desc}</p>
                                        </div>
                                    )) : (<p className="text-muted text-center" style={{ marginTop: '2rem' }}>No recent activity.</p>)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* masterlist */}
                {activeTab === 'masterlist' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="flex-between flex-wrap gap-2 no-print">
                            <h2 className="m-0 text-primary" style={{ fontSize: '1.8rem' }}>Franchise Master List</h2>
                            <div className="flex-row flex-wrap gap-1" style={{ alignItems: 'center' }}>
                                <button onClick={() => window.print()} style={{ backgroundColor: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}><img src={printerIcon} width="16" height="16" style={{ filter: 'brightness(0) invert(1)' }} alt="Print" /> Print</button>
                                <button onClick={openAddModal} className="btn-success" style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Add</button>
                                <select value={filterToda} onChange={(e) => setFilterToda(e.target.value)} style={{ margin: 0, padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}>{uniqueTodas.map(toda => <option key={toda} value={toda}>{toda === 'All' ? 'Filter by TODA (All)' : toda}</option>)}</select>
                                <div className="flex-row" style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', padding: '0.4rem 1rem', borderRadius: '8px', alignItems: 'center' }}><img src={searchIcon} width="16" style={{ opacity: 0.5, marginRight: '8px' }} alt="Search" /><input type="text" placeholder="Search Plate/Name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ border: 'none', margin: 0, padding: 0, outline: 'none', width: '150px' }} /></div>
                            </div>
                        </div>

                        <div style={modernTableWrapper}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                                <thead><tr><th style={thStyle}>Operator Details</th><th style={thStyle}>Plate No.</th><th style={thStyle}>TODA</th><th style={thStyle}>Status</th><th style={thStyle}>Validity</th><th style={{...thStyle, textAlign: 'center'}} className="no-print">Actions</th></tr></thead>
                                <tbody>
                                    {sortedFranchises.map(franchise => {
                                        const expiryInfo = checkExpiryStatus(franchise.dateApplied);
                                        return (
                                            <tr key={franchise._id} style={{ transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                                <td style={tdStyle}>
                                                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{franchise.operator?.name || 'Unknown'}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{franchise.operator?.email}</div>
                                                </td>
                                                <td style={{...tdStyle, fontWeight: '600'}}>{franchise.plateNo}</td>
                                                <td style={tdStyle}>{franchise.todaName}</td>
                                                <td style={tdStyle}><span className={`badge ${franchise.status.toLowerCase()}`}>{franchise.status}</span></td>
                                                <td style={tdStyle}><span style={{ display: 'block', fontWeight: '600' }}>{getExpiryDate(franchise.dateApplied)}</span><span style={{ display: 'block', color: expiryInfo.color, fontSize: '0.75rem', marginTop: '2px', fontWeight: '500' }}>{expiryInfo.label}</span></td>
                                                <td style={tdStyle} className="no-print">
                                                    <div className="flex-row gap-1" style={{ justifyContent: 'center' }}>
                                                        <button onClick={() => openViewModal(franchise)} className="btn-primary" style={actionBtn}>{franchise.status === 'Pending' ? 'Review' : 'View'}</button>
                                                        <button onClick={() => promptAdminAction('editFranchise', franchise)} className="btn-warning" style={actionBtn}>Edit</button>
                                                        <button onClick={() => promptAdminAction('deleteFranchise', franchise)} className="btn-danger" style={actionBtn}>Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {sortedFranchises.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No records found.</div>}
                        </div>
                    </div>
                )}

                {/* feedback desk */}
                {activeTab === 'reports' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="flex-between flex-wrap gap-1 mb-1">
                            <h2 className="m-0 text-primary" style={{ fontSize: '1.8rem' }}>Feedback & Support Desk</h2>
                            <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: '600', fontSize: '0.9rem' }}>Total Tickets: {reports.length}</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {reports.length === 0 ? <div style={modernCard} className="text-center text-muted p-2">No reports or feedback received.</div> : reports.map(r => (
                                <div key={r._id} style={{ ...modernCard, borderLeft: `6px solid ${r.status === 'Resolved' ? '#2FA084' : '#ef4444'}`, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    
                                    <div className="flex-between flex-wrap gap-1" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                        <div className="flex-row gap-1" style={{ alignItems: 'center' }}>
                                            {r.operator?.profilePic ? <img src={getImageUrl(r.operator.profilePic)} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} /> : <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><img src={usersIcon} style={{ width: '20px', opacity: 0.5 }} alt="Default" /></div>}
                                            <div>
                                                <strong style={{ color: '#0f172a', display: 'block' }}>{r.operator?.name || 'Unknown Operator'}</strong>
                                                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{new Date(r.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', backgroundColor: r.status === 'Resolved' ? '#eaf6f3' : '#fee2e2', color: r.status === 'Resolved' ? '#2FA084' : '#ef4444' }}>{r.status}</span>
                                    </div>
                                    
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1.1rem' }}>{r.subject}</h4>
                                        <p style={{ margin: 0, color: '#475569', lineHeight: '1.6', fontSize: '0.95rem' }}>{r.message}</p>
                                    </div>

                                    {r.response ? (
                                        <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6', marginTop: '0.5rem' }}>
                                            <p style={{ margin: '0 0 0.2rem 0', fontWeight: '600', color: '#3b82f6', fontSize: '0.85rem', textTransform: 'uppercase' }}>Admin Reply:</p>
                                            <p style={{ margin: 0, color: '#334155', fontSize: '0.95rem', lineHeight: '1.5' }}>{r.response}</p>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                                            <button onClick={() => setReplyModal({ isOpen: true, reportId: r._id, responseText: '' })} className="btn-primary" style={{ ...actionBtn, padding: '0.6rem 1.5rem' }}>Write Reply</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* detailed analytics with proper grid for web and mobile */}
                {activeTab === 'analytics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="print-header" style={{ display: 'none', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                            <h2 className="text-center mb-1">Municipality of Gasan</h2>
                            <h3 className="text-center text-muted m-0">Tricycle Franchise Analytics Report</h3>
                            <p className="text-center mt-1">Period: {getMonthName(analyticsMonth)}</p>
                        </div>

                        <div className="flex-between mb-1 no-print flex-wrap gap-2">
                            <h2 className="m-0 text-primary" style={{ fontSize: '1.8rem' }}>Data Analytics</h2>
                            <div className="flex-row gap-1" style={{ alignItems: 'center', flexWrap: 'wrap' }}>
                                <button onClick={() => window.print()} style={{ backgroundColor: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                                    <img src={printerIcon} width="16" height="16" style={{ filter: 'brightness(0) invert(1)' }} alt="Print" /> Print Report
                                </button>
                                <div style={{ backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                                    <span style={{ padding: '0.6rem 1rem', backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1', color: '#475569', fontWeight: '500', fontSize: '0.9rem' }}>Period</span>
                                    <select value={analyticsMonth} onChange={(e) => setAnalyticsMonth(e.target.value)} style={{ border: 'none', margin: 0, padding: '0.6rem 1rem', outline: 'none', cursor: 'pointer', backgroundColor: 'transparent' }}>
                                        <option value="All">All Time</option><option value="0">Jan</option><option value="1">Feb</option><option value="2">Mar</option><option value="3">Apr</option><option value="4">May</option><option value="5">Jun</option><option value="6">Jul</option><option value="7">Aug</option><option value="8">Sep</option><option value="9">Oct</option><option value="10">Nov</option><option value="11">Dec</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                            <div style={{...modernCard, borderTop: '4px solid #3b82f6', textAlign: 'center'}}>
                                <h3 className="m-0" style={{ fontSize: '2.5rem', color: '#3b82f6', fontWeight: '700' }}>{analyticsFiltered.length}</h3>
                                <p className="font-bold text-muted m-0 mt-1" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>Total Applications</p>
                            </div>
                            <div style={{...modernCard, borderTop: '4px solid #2FA084', textAlign: 'center'}}>
                                <h3 className="m-0" style={{ fontSize: '2.5rem', color: '#2FA084', fontWeight: '700' }}>{analyticsFiltered.filter(f => f.status === 'Active').length}</h3>
                                <p className="font-bold text-muted m-0 mt-1" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>Total Active</p>
                            </div>
                            <div style={{...modernCard, borderTop: '4px solid #ef4444', textAlign: 'center'}}>
                                <h3 className="m-0" style={{ fontSize: '2.5rem', color: '#ef4444', fontWeight: '700' }}>{analyticsFiltered.filter(f => f.status === 'Cancelled').length}</h3>
                                <p className="font-bold text-muted m-0 mt-1" style={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>Cancelled / Declined</p>
                            </div>
                        </div>

                        {analyticsFiltered.length === 0 ? (
                            <div style={modernCard} className="text-center p-2"><p className="text-muted m-0">No data recorded for this period.</p></div>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                
                                <div style={{...modernCard, pageBreakInside: 'avoid', minWidth: 0 }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', textAlign: 'center' }}>Franchises Per TODA</h3>
                                    <div style={{ height: '300px', width: '100%' }}>
                                        <ResponsiveContainer width="99%" height="100%">
                                            <PieChart>
                                                <Pie data={todaChartData} cx="50%" cy="45%" outerRadius={90} dataKey="value" label>
                                                    {todaChartData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.8rem' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div style={{...modernCard, pageBreakInside: 'avoid', minWidth: 0 }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', textAlign: 'center' }}>Application Types</h3>
                                    <div style={{ height: '300px', width: '100%' }}>
                                        <ResponsiveContainer width="99%" height="100%">
                                            <PieChart>
                                                <Pie data={typeChartData} cx="50%" cy="45%" innerRadius={60} outerRadius={90} dataKey="value" label>
                                                    {typeChartData.map((e, i) => <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '0.8rem' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div style={{...modernCard, gridColumn: '1 / -1', pageBreakInside: 'avoid', minWidth: 0 }}>
                                    <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Application Status Overview</h3>
                                    <div style={{ height: '350px', width: '100%' }}>
                                        <ResponsiveContainer width="99%" height="100%">
                                            <BarChart data={statusChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: '0.85rem' }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: '0.85rem' }} dx={-10} />
                                                <RechartsTooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                                                <Bar dataKey="count" fill="#2FA084" radius={[6, 6, 0, 0]} maxBarSize={50} />
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h2 className="m-0 text-primary" style={{ fontSize: '1.8rem' }}>Office Schedule</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            <div style={modernCard}>
                                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Create Schedule</h3>
                                <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    <div><label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Date</label><input type="date" value={calendarForm.date} onChange={(e) => setCalendarForm({...calendarForm, date: e.target.value})} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div>
                                    <div><label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Status</label><select value={calendarForm.status} onChange={(e) => setCalendarForm({...calendarForm, status: e.target.value})} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}><option value="Available">Available</option><option value="E-Sign Mode">E-Sign Mode</option><option value="Unavailable">Unavailable</option></select></div>
                                    <div><label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>Note / Remarks</label><input type="text" value={calendarForm.note} onChange={(e) => setCalendarForm({...calendarForm, note: e.target.value})} placeholder="Ex. Mayor is out of town" required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div>
                                    <button type="submit" className="btn-primary" style={{ padding: '0.8rem', borderRadius: '8px', fontWeight: '600', marginTop: '0.5rem' }}>Save Schedule</button>
                                </form>
                            </div>
                            <div style={modernCard}>
                                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Upcoming Schedules</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                                    {calendarEvents.length === 0 ? <p className="text-muted text-center">No schedules created.</p> : calendarEvents.map(ev => (
                                        <div key={ev._id} style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', borderLeft: `5px solid ${ev.status === 'Available' ? '#2FA084' : ev.status === 'E-Sign Mode' ? '#f59e0b' : '#ef4444'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <h4 style={{ margin: '0 0 0.3rem 0', color: '#0f172a' }}>{ev.date}</h4>
                                                <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: ev.status === 'Available' ? '#2FA084' : ev.status === 'E-Sign Mode' ? '#d97706' : '#ef4444' }}>{ev.status}</span>
                                                <p style={{ margin: '0.3rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>{ev.note}</p>
                                            </div>
                                            <button onClick={() => handleDeleteEvent(ev._id)} className="btn-danger" style={{ padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500' }}>Delete</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* users */}
                {activeTab === 'users' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div className="flex-between mb-1 flex-wrap gap-1">
                            <h2 className="m-0 text-primary" style={{ fontSize: '1.8rem' }}>System Users Management</h2>
                            <span style={{ backgroundColor: '#e2e8f0', color: '#334155', padding: '0.5rem 1rem', borderRadius: '20px', fontWeight: '600', fontSize: '0.9rem' }}>Total Accounts: {users.length}</span>
                        </div>
                        <div style={modernTableWrapper}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                                <thead><tr><th style={thStyle} className="text-center">Profile</th><th style={thStyle}>Full Name</th><th style={thStyle}>Email Address</th><th style={thStyle}>Account Role</th><th style={{...thStyle, textAlign: 'center'}}>Actions</th></tr></thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user._id} style={{ transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                                            <td style={{...tdStyle, display: 'flex', justifyContent: 'center'}}>
                                                {user.profilePic ? (<img src={getImageUrl(user.profilePic)} alt="Profile" style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0' }} />) : (<div style={{ width: '45px', height: '45px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1' }}><img src={usersIcon} style={{ width: '24px', opacity: 0.4 }} alt="Default" /></div>)}
                                            </td>
                                            <td style={{...tdStyle, fontWeight: '600'}}>{user.name}</td>
                                            <td style={{...tdStyle, color: '#64748b'}}>{user.email}</td>
                                            <td style={tdStyle}><span style={{ padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', backgroundColor: user.role === 'admin' ? '#fee2e2' : '#eaf6f3', color: user.role === 'admin' ? '#ef4444' : '#2FA084' }}>{user.role}</span></td>
                                            <td style={tdStyle}>
                                                <div className="flex-row gap-1" style={{ justifyContent: 'center' }}>
                                                    <button onClick={() => setUserModal({ isOpen: true, mode: 'view', data: user })} className="btn-primary" style={actionBtn}>View</button>
                                                    <button onClick={() => promptAdminAction('edit', user)} className="btn-warning" style={actionBtn}>Edit</button>
                                                    <button onClick={() => promptAdminAction('delete', user)} className="btn-danger" style={actionBtn}>Delete</button>
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

            {/* all modals */}
            {replyModal.isOpen && ( <div className="modal-overlay" style={{ zIndex: 100, backdropFilter: 'blur(4px)' }}><div style={{...modernCard, width: '100%', maxWidth: '500px', margin: '1rem'}}><button onClick={() => setReplyModal({ isOpen: false, reportId: null, responseText: '' })} style={closeBtnStyle}>&times;</button><h2 style={{ marginTop: 0, color: '#1e293b' }}>Respond to Ticket</h2><form onSubmit={handleAdminReply}><textarea rows="5" value={replyModal.responseText} onChange={(e) => setReplyModal({...replyModal, responseText: e.target.value})} placeholder="Type your response here. The operator will see this..." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical', fontSize: '0.95rem' }} required></textarea><button type="submit" className="btn-success w-100" style={{ padding: '0.8rem', borderRadius: '8px', fontWeight: '600', marginTop: '1rem' }}>Submit Reply & Resolve</button></form></div></div> )}
            
            {showFormModal && ( <div className="modal-overlay" style={{ zIndex: 100, backdropFilter: 'blur(4px)' }}><div style={{...modernCard, width: '100%', maxWidth: '700px', margin: '1rem', maxHeight: '90vh', overflowY: 'auto'}}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}><h2 style={{ margin: 0, color: '#1e293b' }}>{editingId ? 'Edit Franchise Record' : 'Register New Franchise'}</h2><button onClick={() => setShowFormModal(false)} style={closeBtnStyle}>&times;</button></div><form onSubmit={handleSaveFranchise}><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}><div style={{ gridColumn: '1 / -1' }}><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Select Operator</label><select name="operator" value={formData.operator} onChange={handleFormChange} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}><option value="" disabled>Choose operator from users...</option>{users.filter(u => u.role === 'operator').map(user => <option key={user._id} value={user._id}>{user.name}</option>)}</select></div><div><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>TODA Name</label><input type="text" name="todaName" value={formData.todaName} onChange={handleFormChange} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div><div><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Operating Zone</label><input type="text" name="zone" value={formData.zone} onChange={handleFormChange} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div><div><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Plate Number</label><input type="text" name="plateNo" value={formData.plateNo} onChange={handleFormChange} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div><div><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Year Made</label><input type="text" name="made" value={formData.made} onChange={handleFormChange} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div><div style={{ gridColumn: '1 / -1' }}><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Brand / Make</label><input type="text" name="make" value={formData.make} onChange={handleFormChange} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div><div><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Motor Number</label><input type="text" name="motorNo" value={formData.motorNo} onChange={handleFormChange} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div><div><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Chassis Number</label><input type="text" name="chassisNo" value={formData.chassisNo} onChange={handleFormChange} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div><div><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Application Type</label><select name="applicationType" value={formData.applicationType} onChange={handleFormChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}><option value="New">New Application</option><option value="Renewal">Renewal</option></select></div><div><label style={{ block: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Initial Status</label><select name="status" value={formData.status} onChange={handleFormChange} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}><option value="Active">Active</option><option value="Pending">Pending</option><option value="Expired">Expired</option><option value="Cancelled">Cancelled</option></select></div></div><div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}><button type="button" onClick={() => setShowFormModal(false)} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button><button type="submit" className="btn-primary" style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', fontWeight: '600' }}>Save Franchise</button></div></form></div></div> )}
            
            {selectedFranchise && ( <div className="modal-overlay no-print" style={{ zIndex: 100, backdropFilter: 'blur(4px)' }}><div style={{...modernCard, width: '100%', maxWidth: '800px', margin: '1rem', maxHeight: '90vh', overflowY: 'auto'}}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.5rem' }}><div><h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{selectedFranchise.status === 'Pending' ? 'Review Application' : 'Franchise Details'}</h2><div className="flex-row flex-wrap gap-1" style={{ alignItems: 'center' }}><span className={`badge ${selectedFranchise.status.toLowerCase()}`}>{selectedFranchise.status}</span><span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#64748b', backgroundColor: '#f1f5f9', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>{selectedFranchise.applicationType} App</span><span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>Valid Until: {getExpiryDate(selectedFranchise.dateApplied)}</span></div></div><button onClick={() => setSelectedFranchise(null)} style={closeBtnStyle}>&times;</button></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}><div style={{ backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '8px', borderLeft: '4px solid #2FA084' }}><h4 style={{ margin: '0 0 0.8rem 0', color: '#2FA084', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Operator Information</h4><p style={{ margin: '0 0 0.4rem 0', color: '#334155', fontSize: '0.95rem' }}><strong style={{ color: '#0f172a' }}>Name:</strong> {selectedFranchise.operator?.name}</p><p style={{ margin: 0, color: '#334155', fontSize: '0.95rem' }}><strong style={{ color: '#0f172a' }}>Email:</strong> {selectedFranchise.operator?.email}</p></div><div style={{ backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}><h4 style={{ margin: '0 0 0.8rem 0', color: '#3b82f6', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Tricycle Specifications</h4><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}><p style={{ margin: 0, color: '#334155', fontSize: '0.9rem' }}><strong style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Plate No</strong> {selectedFranchise.plateNo}</p><p style={{ margin: 0, color: '#334155', fontSize: '0.9rem' }}><strong style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>TODA/Zone</strong> {selectedFranchise.todaName} - {selectedFranchise.zone}</p><p style={{ margin: 0, color: '#334155', fontSize: '0.9rem' }}><strong style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Unit</strong> {selectedFranchise.make} {selectedFranchise.made}</p><p style={{ margin: 0, color: '#334155', fontSize: '0.9rem' }}><strong style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Motor/Chassis</strong> {selectedFranchise.motorNo} / {selectedFranchise.chassisNo}</p></div></div><div style={{ backgroundColor: '#f8fafc', padding: '1.2rem', borderRadius: '8px', borderLeft: '4px solid #f59e0b', gridColumn: '1 / -1' }}><h4 style={{ margin: '0 0 0.8rem 0', color: '#d97706', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Submitted Documents</h4><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}><p style={{ margin: 0, color: '#334155', fontSize: '0.9rem' }}><strong style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Cedula CTC No.</strong> {selectedFranchise.cedulaSerialNo || 'N/A'}</p><p style={{ margin: 0, color: '#334155', fontSize: '0.9rem' }}><strong style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase' }}>Date & Place Issued</strong> {selectedFranchise.cedulaDate ? new Date(selectedFranchise.cedulaDate).toLocaleDateString() : 'N/A'} - {selectedFranchise.cedulaAddress || 'N/A'}</p></div>{selectedFranchise.orCrUrl && (<div><strong style={{ display: 'block', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem' }}>OR/CR Uploaded File</strong>{selectedFranchise.orCrUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (<div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', display: 'flex', justifyContent: 'center', padding: '1rem' }}><img src={getImageUrl(selectedFranchise.orCrUrl)} alt="OR/CR Document" style={{ maxWidth: '100%', maxHeight: '350px', objectFit: 'contain' }} /></div>) : (<a href={getImageUrl(selectedFranchise.orCrUrl)} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-block', padding: '0.8rem 1.5rem', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>Open PDF Document</a>)}</div>)}</div>{selectedFranchise.status === 'Cancelled' && selectedFranchise.cancelReason && (<div style={{ backgroundColor: '#fee2e2', padding: '1.2rem', borderRadius: '8px', borderLeft: '4px solid #ef4444', gridColumn: '1 / -1' }}><h4 style={{ margin: '0 0 0.5rem 0', color: '#b91c1c', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Reason for Cancellation</h4><p style={{ margin: 0, color: '#7f1d1d', fontSize: '1rem', fontWeight: '500' }}>"{selectedFranchise.cancelReason}"</p></div>)}</div>{selectedFranchise.status !== 'Active' && (<form onSubmit={handleAdvancedApproval} style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: '#f1f5f9', borderRadius: '12px', border: '1px solid #cbd5e1' }}><h4 style={{ margin: '0 0 1rem 0', color: '#0f172a', fontSize: '1.1rem' }}>Admin Action Panel</h4><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}><div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Update Status</label><select value={viewModalData.status} onChange={(e) => setViewModalData({...viewModalData, status: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fff' }}><option value="Pending">Pending (Needs Review)</option><option value="Active">Approve (Active)</option><option value="Expired">Expired</option><option value="Cancelled">Decline / Cancel</option></select></div><div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Estimated Release Date</label><input type="date" value={viewModalData.releaseDate} onChange={(e) => setViewModalData({...viewModalData, releaseDate: e.target.value})} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#fff' }} /></div><div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#fff', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}><input type="checkbox" id="esignCheck" checked={viewModalData.eSigned} onChange={(e) => setViewModalData({...viewModalData, eSigned: e.target.checked})} style={{ width: '20px', height: '20px', cursor: 'pointer' }} /><label htmlFor="esignCheck" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#334155', cursor: 'pointer', userSelect: 'none' }}>Activate E-Signature (For absent officials)</label></div></div><button type="submit" className="btn-primary w-100" style={{ padding: '1rem', borderRadius: '8px', fontWeight: '600', fontSize: '1.05rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>Save Action & Update Status</button></form>)}{selectedFranchise.status === 'Active' && (<button onClick={() => handlePrintPermit(selectedFranchise)} className="btn-success w-100" style={{ marginTop: '2rem', padding: '1rem', borderRadius: '8px', fontWeight: '600', fontSize: '1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}><img src={printerIcon} width="20" height="20" style={{ filter: 'brightness(0) invert(1)' }} alt="Print" /> Print Official Franchise Permit</button>)}</div></div> )}
            
            {passwordPrompt.isOpen && ( <div className="modal-overlay" style={{ zIndex: 200, backdropFilter: 'blur(4px)' }}><div style={{...modernCard, width: '100%', maxWidth: '400px', margin: '1rem', textAlign: 'center'}}><button onClick={() => setPasswordPrompt({ isOpen: false, action: null, password: '' })} style={{...closeBtnStyle, position: 'absolute', top: '15px', right: '15px'}}>&times;</button><h2 style={{ margin: '0 0 0.5rem 0', color: '#0f172a' }}>Security Verification</h2><p style={{ color: '#64748b', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Please verify your Admin Password to continue with this sensitive action.</p><form onSubmit={handleVerifyPassword}><input type="password" placeholder="Enter Admin Password..." value={passwordPrompt.password} onChange={(e) => setPasswordPrompt({...passwordPrompt, password: e.target.value})} required autoFocus style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', marginBottom: '1rem', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.2em' }} /><button type="submit" className="btn-danger w-100" style={{ padding: '1rem', borderRadius: '8px', fontWeight: '600', fontSize: '1rem' }}>Verify Identity</button></form></div></div> )}
            
            {userModal.isOpen && ( <div className="modal-overlay" style={{ zIndex: 100, backdropFilter: 'blur(4px)' }}><div style={{...modernCard, width: '100%', maxWidth: '500px', margin: '1rem'}}><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}><h2 style={{ margin: 0, color: '#1e293b' }}>{userModal.mode === 'edit' ? 'Edit User Details' : 'Account Overview'}</h2><button onClick={() => setUserModal({ isOpen: false, mode: 'view', data: null })} style={closeBtnStyle}>&times;</button></div>{userModal.mode === 'view' ? (<div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1rem' }}>{userModal.data.profilePic ? (<img src={getImageUrl(userModal.data.profilePic)} alt="Profile" style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />) : (<div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}><img src={usersIcon} style={{ width: '50px', opacity: 0.4 }} alt="Default" /></div>)}</div><div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}><p style={{ margin: '0 0 0.3rem 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' }}>Full Name</p><p style={{ margin: 0, color: '#0f172a', fontWeight: '600', fontSize: '1.1rem' }}>{userModal.data.name}</p></div><div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}><p style={{ margin: '0 0 0.3rem 0', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' }}>Email Address</p><p style={{ margin: 0, color: '#0f172a', fontWeight: '600', fontSize: '1.1rem' }}>{userModal.data.email}</p></div><div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: '600' }}>Account Role</p><span style={{ padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', backgroundColor: userModal.data.role === 'admin' ? '#fee2e2' : '#eaf6f3', color: userModal.data.role === 'admin' ? '#ef4444' : '#2FA084' }}>{userModal.data.role}</span></div></div>) : (<form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}><div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Full Name</label><input type="text" value={userFormData.name} onChange={(e) => setUserFormData({...userFormData, name: e.target.value})} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div><div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Email Address</label><input type="email" value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} /></div><div><label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.4rem' }}>Account Role</label><select value={userFormData.role} onChange={(e) => setUserFormData({...userFormData, role: e.target.value})} required style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}><option value="operator">Operator</option><option value="admin">Admin</option></select></div><div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}><button type="button" onClick={() => setUserModal({ isOpen: false, mode: 'view', data: null })} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button><button type="submit" className="btn-primary" style={{ flex: 2, padding: '0.8rem', borderRadius: '8px', fontWeight: '600', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>Save Changes</button></div></form>)}</div></div> )}
        </div>
    );
}