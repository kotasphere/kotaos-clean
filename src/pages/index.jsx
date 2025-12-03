import Layout from "./Layout.jsx";

import Assistant from "./Assistant";

import Calendar from "./Calendar";

import Tasks from "./Tasks";

import Vault from "./Vault";

import Contacts from "./Contacts";

import EmailDrafts from "./EmailDrafts";

import Projects from "./Projects";

import Subscriptions from "./Subscriptions";

import Settings from "./Settings";

import Bills from "./Bills";

import Messages from "./Messages";

import Notifications from "./Notifications";

import Learning from "./Learning";

import PrivacyPolicy from "./PrivacyPolicy";

import Support from "./Support";

import Insights from "./Insights";

import ConversationManager from "./ConversationManager";

import Daily from "./Daily";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Assistant: Assistant,
    
    Calendar: Calendar,
    
    Tasks: Tasks,
    
    Vault: Vault,
    
    Contacts: Contacts,
    
    EmailDrafts: EmailDrafts,
    
    Projects: Projects,
    
    Subscriptions: Subscriptions,
    
    Settings: Settings,
    
    Bills: Bills,
    
    Messages: Messages,
    
    Notifications: Notifications,
    
    Learning: Learning,
    
    PrivacyPolicy: PrivacyPolicy,
    
    Support: Support,
    
    Insights: Insights,
    
    ConversationManager: ConversationManager,
    
    Daily: Daily,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Assistant />} />
                
                
                <Route path="/Assistant" element={<Assistant />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/Tasks" element={<Tasks />} />
                
                <Route path="/Vault" element={<Vault />} />
                
                <Route path="/Contacts" element={<Contacts />} />
                
                <Route path="/EmailDrafts" element={<EmailDrafts />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/Subscriptions" element={<Subscriptions />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Bills" element={<Bills />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/Notifications" element={<Notifications />} />
                
                <Route path="/Learning" element={<Learning />} />
                
                <Route path="/PrivacyPolicy" element={<PrivacyPolicy />} />
                
                <Route path="/Support" element={<Support />} />
                
                <Route path="/Insights" element={<Insights />} />
                
                <Route path="/ConversationManager" element={<ConversationManager />} />
                
                <Route path="/Daily" element={<Daily />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}