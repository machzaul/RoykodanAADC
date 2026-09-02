'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  BookOpen,
  Settings,
  HelpCircle,
  Plus,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Upload,
  ArrowRight,
  LogOut,
  ChevronRight,
  TrendingUp,
  Download,
  Share2,
  QrCode,
  Users
} from 'lucide-react';

// Types
interface QuizSummary {
  id: string;
  title: string;
  slug: string;
  status: boolean;
  createdAt: string;
  _count: {
    questions: number;
    sessions: number;
  };
}

interface Answer {
  id?: string;
  text: string;
  score: number;
  resultMapping: Record<string, number>;
}

interface Question {
  id: string;
  text: string;
  order: number;
  image: string | null;
  answers: Answer[];
}

interface ResultOption {
  id: string;
  code: string;
  title: string;
  subTitle: string | null;
  description: string;
  image: string;
  backgroundColor: string;
  ctaText: string;
  ctaUrl: string | null;
}

interface AnalyticsSummary {
  totalParticipants: number;
  totalCompleted: number;
  downloadCount: number;
  shareCount: number;
  qrScanCount: number;
}

interface DistributionItem {
  id: string;
  title: string;
  code: string;
  subTitle: string | null;
  count: number;
  percentage: number;
}

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Tab state: 'analytics' | 'quizzes' | 'questions' | 'results'
  const [activeTab, setActiveTab] = useState<'analytics' | 'quizzes' | 'questions' | 'results'>('analytics');

  // Lists & details
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [selectedQuizDetail, setSelectedQuizDetail] = useState<{
    id: string;
    title: string;
    description: string | null;
    slug: string;
    status: boolean;
    questions: Question[];
    resultOptions: ResultOption[];
  } | null>(null);

  // Analytics data
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary | null>(null);
  const [distribution, setDistribution] = useState<DistributionItem[]>([]);

  // Action status message
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals & New entry states
  const [isEditingQuizMetadata, setIsEditingQuizMetadata] = useState(false);
  const [quizForm, setQuizForm] = useState({ title: '', slug: '', description: '', status: false });

  // Load token from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_token');
      if (stored) {
        setToken(stored);
      }
    }
  }, []);

  // Fetch quizzes list and analytics when authenticated
  useEffect(() => {
    if (token) {
      fetchQuizzes();
      fetchAnalytics();
    }
  }, [token]);

  // Fetch specific quiz details when selected
  useEffect(() => {
    if (token && selectedQuizId) {
      fetchQuizDetail(selectedQuizId);
    }
  }, [token, selectedQuizId]);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // API calls
  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/admin/quizzes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load quizzes');
      const data = await res.json();
      setQuizzes(data);
      if (data.length > 0 && !selectedQuizId) {
        setSelectedQuizId(data[0].id);
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const fetchQuizDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/quizzes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load quiz details');
      const data = await res.json();
      setSelectedQuizDetail(data);
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [summaryRes, distRes] = await Promise.all([
        fetch('/api/admin/analytics/summary', { headers }),
        fetch('/api/admin/analytics/distribution', { headers }),
      ]);

      if (summaryRes.ok) {
        setAnalyticsSummary(await summaryRes.json());
      }
      if (distRes.ok) {
        const data = await distRes.json();
        setDistribution(data.distribution);
      }
    } catch (err: any) {
      console.error('Analytics load error:', err);
    }
  };

  // Auth Submit
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      localStorage.setItem('admin_token', data.token);
      setToken(data.token);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setPassword('');
  };

  // Create or Update Quiz
  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isNew = !selectedQuizDetail || isEditingQuizMetadata === false;

    try {
      const url = isNew ? '/api/admin/quizzes' : `/api/admin/quizzes/${selectedQuizId}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quizForm),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save quiz metadata');

      showStatus('Quiz metadata saved successfully!');
      setIsEditingQuizMetadata(false);
      fetchQuizzes();
      if (!isNew) {
        fetchQuizDetail(selectedQuizId);
      } else {
        setSelectedQuizId(data.id);
      }
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  // Handle Question Changes
  const handleSaveQuestion = async (q: Question) => {
    try {
      const url = '/api/admin/questions';
      const res = await fetch(url, {
        method: q.id.startsWith('new_') ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...q,
          quizId: selectedQuizId,
          id: q.id.startsWith('new_') ? undefined : q.id,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save question');
      }

      showStatus('Question saved successfully!');
      fetchQuizDetail(selectedQuizId);
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (questionId.startsWith('new_')) {
      // Just local filter
      if (selectedQuizDetail) {
        setSelectedQuizDetail({
          ...selectedQuizDetail,
          questions: selectedQuizDetail.questions.filter((q) => q.id !== questionId),
        });
      }
      return;
    }

    if (!confirm('Are you sure you want to delete this question and all of its answer options?')) return;

    try {
      const res = await fetch(`/api/admin/questions?id=${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete question');

      showStatus('Question deleted successfully');
      fetchQuizDetail(selectedQuizId);
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  // Handle Result Card Changes
  const handleSaveResult = async (resOption: ResultOption) => {
    try {
      const url = '/api/admin/results';
      const isNew = resOption.id.startsWith('new_');
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...resOption,
          quizId: selectedQuizId,
          id: isNew ? undefined : resOption.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to save result template');

      showStatus('Result template saved successfully!');
      fetchQuizDetail(selectedQuizId);
      fetchAnalytics(); // update distributions
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  const handleDeleteResult = async (resOptionId: string) => {
    if (resOptionId.startsWith('new_')) {
      if (selectedQuizDetail) {
        setSelectedQuizDetail({
          ...selectedQuizDetail,
          resultOptions: selectedQuizDetail.resultOptions.filter((r) => r.id !== resOptionId),
        });
      }
      return;
    }

    if (!confirm('Are you sure you want to delete this result card template?')) return;

    try {
      const res = await fetch(`/api/admin/results?id=${resOptionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to delete result template');

      showStatus('Result card template deleted successfully');
      fetchQuizDetail(selectedQuizId);
      fetchAnalytics();
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  // Image Upload handler for individual elements
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      callback(data.url);
      showStatus('Image uploaded successfully!');
    } catch (err: any) {
      showStatus(err.message, 'error');
    }
  };

  // Add dummy local question
  const addNewLocalQuestion = () => {
    if (!selectedQuizDetail) return;
    const tempId = `new_${Date.now()}`;
    const newQ: Question = {
      id: tempId,
      text: 'QUESTION TEXT HERE?',
      order: selectedQuizDetail.questions.length + 1,
      image: null,
      answers: [
        { text: 'Option 1', score: 1, resultMapping: {} },
        { text: 'Option 2', score: 1, resultMapping: {} },
        { text: 'Option 3', score: 1, resultMapping: {} },
        { text: 'Option 4', score: 1, resultMapping: {} },
        { text: 'Option 5', score: 1, resultMapping: {} },
      ],
    };
    setSelectedQuizDetail({
      ...selectedQuizDetail,
      questions: [...selectedQuizDetail.questions, newQ],
    });
  };

  // Add dummy local result card
  const addNewLocalResult = () => {
    if (!selectedQuizDetail) return;
    const tempId = `new_${Date.now()}`;
    const newRes: ResultOption = {
      id: tempId,
      code: 'NEW_CODE',
      title: 'RECIPE TITLE',
      subTitle: 'CATEGORY CODE',
      description: 'Recipe description card here.',
      image: '',
      backgroundColor: '#E53E3E',
      ctaText: 'COOK IT NOW',
      ctaUrl: '',
    };
    setSelectedQuizDetail({
      ...selectedQuizDetail,
      resultOptions: [...selectedQuizDetail.resultOptions, newRes],
    });
  };

  // UNAUTHENTICATED LOGIN SCREEN
  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto flex items-center justify-center min-h-[85vh]">
        <div className="bg-gray-800 p-8 rounded-2xl border border-gray-700 shadow-2xl w-full text-white">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black uppercase tracking-wider text-red-500">Eggspresi Cinta</h1>
            <p className="text-xs text-gray-400 mt-1 uppercase font-semibold">Admin CMS Panel Login</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            {authError && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{authError}</span>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Password</label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 text-sm mt-1"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-3.5 rounded-xl uppercase tracking-wider text-sm mt-2 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Login Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-6 bg-gray-950 min-h-[90vh] rounded-3xl p-4 md:p-8 text-white border border-gray-800 shadow-2xl relative">
      
      {/* Alert toast notification */}
      {statusMessage && (
        <div className={`fixed bottom-5 right-5 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce ${
          statusMessage.type === 'success' ? 'bg-green-600 border border-green-500' : 'bg-red-600 border border-red-500'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="text-xs font-bold">{statusMessage.text}</span>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-4 border-b md:border-b-0 md:border-r border-gray-800 pb-4 md:pb-0 md:pr-6">
        <div>
          <h2 className="text-lg font-black uppercase text-red-500">Eggspresi Cinta</h2>
          <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Admin Campaign Control</span>
        </div>

        {/* Campaign dropdown selector */}
        <div className="mt-2">
          <label className="text-[9px] uppercase font-bold text-gray-400">Active Campaign</label>
          <select
            value={selectedQuizId}
            onChange={(e) => setSelectedQuizId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-lg py-2 px-3 mt-1 text-xs focus:outline-none focus:border-red-500"
          >
            {quizzes.map((q) => (
              <option key={q.id} value={q.id}>
                {q.title} {q.status ? '(Active)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-row md:flex-col gap-2 mt-4 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider shrink-0 cursor-pointer ${
              activeTab === 'analytics' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </button>
          
          <button
            onClick={() => {
              setActiveTab('quizzes');
              if (selectedQuizDetail) {
                setQuizForm({
                  title: selectedQuizDetail.title,
                  slug: selectedQuizDetail.slug,
                  description: selectedQuizDetail.description || '',
                  status: selectedQuizDetail.status,
                });
              }
            }}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider shrink-0 cursor-pointer ${
              activeTab === 'quizzes' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Campaign Specs</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider shrink-0 cursor-pointer ${
              activeTab === 'questions' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Questions</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase transition-all tracking-wider shrink-0 cursor-pointer ${
              activeTab === 'results' ? 'bg-red-600 text-white shadow-lg' : 'hover:bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Result Cards</span>
          </button>
        </nav>

        {/* User profile / Logout */}
        <div className="mt-auto pt-4 border-t border-gray-900 flex items-center justify-between">
          <span className="text-[10px] text-gray-500 uppercase font-bold">Admin Session</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* DASHBOARD CONTENT BODY */}
      <main className="flex-1 min-w-0">
        
        {/* TAB 1: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-black uppercase">Campaign Performance Analytics</h3>
              <p className="text-xs text-gray-400 mt-0.5">Real-time interactions tracking metrics.</p>
            </div>

            {/* Statistics Key Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800">
                <div className="flex justify-between items-start text-gray-400">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-[9px] uppercase font-black">Participants</span>
                </div>
                <h4 className="text-2xl font-black mt-2">{analyticsSummary?.totalParticipants ?? 0}</h4>
              </div>

              <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800">
                <div className="flex justify-between items-start text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-[9px] uppercase font-black">Completions</span>
                </div>
                <h4 className="text-2xl font-black mt-2">{analyticsSummary?.totalCompleted ?? 0}</h4>
              </div>

              <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800">
                <div className="flex justify-between items-start text-gray-400">
                  <Download className="w-4 h-4 text-purple-500" />
                  <span className="text-[9px] uppercase font-black">Downloads</span>
                </div>
                <h4 className="text-2xl font-black mt-2">{analyticsSummary?.downloadCount ?? 0}</h4>
              </div>

              <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800">
                <div className="flex justify-between items-start text-gray-400">
                  <Share2 className="w-4 h-4 text-orange-500" />
                  <span className="text-[9px] uppercase font-black">Shares</span>
                </div>
                <h4 className="text-2xl font-black mt-2">{analyticsSummary?.shareCount ?? 0}</h4>
              </div>

              <div className="bg-gray-900/60 p-4 rounded-2xl border border-gray-800 col-span-2 lg:col-span-1">
                <div className="flex justify-between items-start text-gray-400">
                  <QrCode className="w-4 h-4 text-yellow-500" />
                  <span className="text-[9px] uppercase font-black">QR Scans</span>
                </div>
                <h4 className="text-2xl font-black mt-2">{analyticsSummary?.qrScanCount ?? 0}</h4>
              </div>
            </div>

            {/* Distribution Graph */}
            <div className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800">
              <h4 className="text-xs uppercase font-extrabold tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500" />
                <span>Recipe Result Card Distribution</span>
              </h4>

              {distribution.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 uppercase">
                  No completion data recorded yet.
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {distribution.map((item) => (
                    <div key={item.id} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-xs font-bold uppercase">
                        <span>{item.title} ({item.code})</span>
                        <span className="text-red-400">{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="w-full h-3.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                        <div
                          className="h-full bg-red-600 rounded-full transition-all duration-500"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CAMPAIGN SPECS */}
        {activeTab === 'quizzes' && selectedQuizDetail && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-xl font-black uppercase">Campaign Metadata Configuration</h3>
              <p className="text-xs text-gray-400 mt-0.5">Control slug paths, activation status, and titles.</p>
            </div>

            <form onSubmit={handleQuizSubmit} className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 flex flex-col gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Campaign Title</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full bg-gray-950 border border-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">URL Routing Slug</label>
                <input
                  type="text"
                  value={quizForm.slug}
                  onChange={(e) => setQuizForm({ ...quizForm, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full bg-gray-950 border border-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 text-sm mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-400">Short Description</label>
                <textarea
                  value={quizForm.description}
                  onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                  rows={2}
                  className="w-full bg-gray-950 border border-gray-800 px-4 py-3 rounded-xl focus:outline-none focus:border-red-500 text-sm mt-1 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 select-none">
                <input
                  type="checkbox"
                  id="quiz-status"
                  checked={quizForm.status}
                  onChange={(e) => setQuizForm({ ...quizForm, status: e.target.checked })}
                  className="w-4 h-4 rounded text-red-500 focus:ring-red-500"
                />
                <label htmlFor="quiz-status" className="text-xs uppercase font-bold tracking-wider cursor-pointer">
                  Activate this campaign (Deactivates other campaigns automatically)
                </label>
              </div>

              <button
                type="submit"
                className="self-start bg-green-600 hover:bg-green-500 text-white font-extrabold text-xs py-3 px-6 rounded-xl uppercase tracking-wider flex items-center gap-2 cursor-pointer mt-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: QUESTIONS MANAGER */}
        {activeTab === 'questions' && selectedQuizDetail && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase">Interactive Questions</h3>
                <p className="text-xs text-gray-400 mt-0.5">Manage questions order, answers weight mapping.</p>
              </div>
              <button
                onClick={addNewLocalQuestion}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Question</span>
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {selectedQuizDetail.questions.map((q, qIdx) => (
                <div key={q.id} className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 flex flex-col gap-4">
                  {/* Question header row */}
                  <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                    <span className="text-xs font-black uppercase text-red-400">
                      Question #{qIdx + 1} {q.id.startsWith('new_') ? '(Unsaved)' : ''}
                    </span>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="text-gray-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question setup details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3">
                      <label className="text-[9px] uppercase font-bold text-gray-400">Question Text</label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => {
                          const updated = [...selectedQuizDetail.questions];
                          updated[qIdx].text = e.target.value;
                          setSelectedQuizDetail({ ...selectedQuizDetail, questions: updated });
                        }}
                        className="w-full bg-gray-950 border border-gray-800 px-3 py-2 mt-1 rounded-lg text-xs focus:outline-none focus:border-red-500 font-semibold text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-400">Sort Order</label>
                      <input
                        type="number"
                        value={q.order}
                        onChange={(e) => {
                          const updated = [...selectedQuizDetail.questions];
                          updated[qIdx].order = parseInt(e.target.value) || 0;
                          setSelectedQuizDetail({ ...selectedQuizDetail, questions: updated });
                        }}
                        className="w-full bg-gray-950 border border-gray-800 px-3 py-2 mt-1 rounded-lg text-xs focus:outline-none focus:border-red-500 text-white font-bold"
                      />
                    </div>
                  </div>

                  {/* Answer Options list */}
                  <div className="mt-2 flex flex-col gap-2">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Answer Options</span>
                    {q.answers.map((ans, ansIdx) => {
                      const letter = String.fromCharCode(65 + ansIdx);
                      return (
                        <div key={ansIdx} className="bg-gray-950/80 p-3 rounded-xl border border-gray-800/80 flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            <span className="w-5 h-5 bg-red-600/30 text-red-300 font-black rounded-full flex items-center justify-center text-[10px]">
                              {letter}
                            </span>
                            <input
                              type="text"
                              value={ans.text}
                              placeholder={`Option ${letter} Text`}
                              onChange={(e) => {
                                const updated = [...selectedQuizDetail.questions];
                                updated[qIdx].answers[ansIdx].text = e.target.value;
                                setSelectedQuizDetail({ ...selectedQuizDetail, questions: updated });
                              }}
                              className="flex-1 bg-transparent border-b border-gray-800 focus:border-red-500 text-xs py-1 focus:outline-none"
                            />
                          </div>

                          {/* Answers weights settings */}
                          <div className="pl-8 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[8px] uppercase font-bold text-gray-500">Weight Category Map (JSON)</label>
                              <input
                                type="text"
                                placeholder='e.g. {"QUALITY_TIME": 3}'
                                value={JSON.stringify(ans.resultMapping)}
                                onChange={(e) => {
                                  try {
                                    const parsed = JSON.parse(e.target.value);
                                    const updated = [...selectedQuizDetail.questions];
                                    updated[qIdx].answers[ansIdx].resultMapping = parsed;
                                    setSelectedQuizDetail({ ...selectedQuizDetail, questions: updated });
                                  } catch (err) {
                                    // Let user edit freely, don't throw immediately
                                  }
                                }}
                                className="w-full bg-gray-900 border border-gray-800 px-2 py-1 mt-1 rounded text-[10px] text-yellow-400 font-mono focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[8px] uppercase font-bold text-gray-500">Default Score Value</label>
                              <input
                                type="number"
                                value={ans.score}
                                onChange={(e) => {
                                  const updated = [...selectedQuizDetail.questions];
                                  updated[qIdx].answers[ansIdx].score = parseInt(e.target.value) || 0;
                                  setSelectedQuizDetail({ ...selectedQuizDetail, questions: updated });
                                }}
                                className="w-full bg-gray-900 border border-gray-800 px-2 py-1 mt-1 rounded text-[10px] focus:outline-none font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => handleSaveQuestion(q)}
                    className="self-start bg-green-600 hover:bg-green-500 text-white font-extrabold text-[10px] py-2.5 px-4 rounded-lg uppercase tracking-wider flex items-center gap-1.5 mt-2 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Question #{qIdx + 1}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: RESULT CARDS CONFIGURATION */}
        {activeTab === 'results' && selectedQuizDetail && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-black uppercase">Result Card Definitions</h3>
                <p className="text-xs text-gray-400 mt-0.5">Edit output badges, colors, and CTA redirects.</p>
              </div>
              <button
                onClick={addNewLocalResult}
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase py-2.5 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Result Card</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {selectedQuizDetail.resultOptions.map((resOption, resIdx) => (
                <div key={resOption.id} className="bg-gray-900/40 p-6 rounded-2xl border border-gray-800 flex flex-col gap-4">
                  
                  {/* Result header row */}
                  <div className="flex justify-between items-center pb-3 border-b border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase text-red-400">
                        Result Template #{resIdx + 1}
                      </span>
                      <span
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: resOption.backgroundColor }}
                        title="Card Theme Color"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteResult(resOption.id)}
                      className="text-gray-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                      title="Delete Result"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-400">Category Identifier Code</label>
                      <input
                        type="text"
                        placeholder="e.g. WORDS_OF_AFFIRMATION"
                        value={resOption.code}
                        onChange={(e) => {
                          const updated = [...selectedQuizDetail.resultOptions];
                          updated[resIdx].code = e.target.value.toUpperCase().replace(/\s+/g, '_');
                          setSelectedQuizDetail({ ...selectedQuizDetail, resultOptions: updated });
                        }}
                        className="w-full bg-gray-950 border border-gray-800 px-3 py-2 mt-1 rounded-lg text-xs focus:outline-none focus:border-red-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-400">Recipe Card Title</label>
                      <input
                        type="text"
                        placeholder="e.g. OMELET VALIDASI"
                        value={resOption.title}
                        onChange={(e) => {
                          const updated = [...selectedQuizDetail.resultOptions];
                          updated[resIdx].title = e.target.value;
                          setSelectedQuizDetail({ ...selectedQuizDetail, resultOptions: updated });
                        }}
                        className="w-full bg-gray-950 border border-gray-800 px-3 py-2 mt-1 rounded-lg text-xs focus:outline-none focus:border-red-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-400">Card Subtitle (Badge Category Name)</label>
                      <input
                        type="text"
                        placeholder="e.g. WORDS OF AFFIRMATION"
                        value={resOption.subTitle || ''}
                        onChange={(e) => {
                          const updated = [...selectedQuizDetail.resultOptions];
                          updated[resIdx].subTitle = e.target.value;
                          setSelectedQuizDetail({ ...selectedQuizDetail, resultOptions: updated });
                        }}
                        className="w-full bg-gray-950 border border-gray-800 px-3 py-2 mt-1 rounded-lg text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="text-[9px] uppercase font-bold text-gray-400">Card Description</label>
                      <textarea
                        value={resOption.description}
                        onChange={(e) => {
                          const updated = [...selectedQuizDetail.resultOptions];
                          updated[resIdx].description = e.target.value;
                          setSelectedQuizDetail({ ...selectedQuizDetail, resultOptions: updated });
                        }}
                        rows={3}
                        className="w-full bg-gray-950 border border-gray-800 px-3 py-2 mt-1 rounded-lg text-xs focus:outline-none focus:border-red-500 resize-none font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] uppercase font-bold text-gray-400">Image Asset Upload</label>
                      
                      {/* Image Upload Input box */}
                      <div className="flex flex-col gap-2 bg-gray-950 p-3 rounded-lg border border-gray-800">
                        {resOption.image ? (
                          <div className="flex items-center gap-2">
                            <img src={resOption.image} className="w-10 h-10 object-contain rounded border border-gray-800 bg-black/40" />
                            <span className="text-[9px] text-gray-400 truncate flex-1">{resOption.image}</span>
                          </div>
                        ) : (
                          <div className="text-[9px] text-gray-500 italic">No image asset set.</div>
                        )}
                        
                        <label className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 py-1.5 px-3 rounded-md text-[10px] font-bold text-center uppercase tracking-wider cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose File</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleImageUpload(e, (url) => {
                                const updated = [...selectedQuizDetail.resultOptions];
                                updated[resIdx].image = url;
                                setSelectedQuizDetail({ ...selectedQuizDetail, resultOptions: updated });
                              })
                            }
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-400">Hex Background Color</label>
                      <div className="flex gap-2 items-center mt-1">
                        <input
                          type="color"
                          value={resOption.backgroundColor}
                          onChange={(e) => {
                            const updated = [...selectedQuizDetail.resultOptions];
                            updated[resIdx].backgroundColor = e.target.value;
                            setSelectedQuizDetail({ ...selectedQuizDetail, resultOptions: updated });
                          }}
                          className="w-8 h-8 rounded border border-gray-800 cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={resOption.backgroundColor}
                          onChange={(e) => {
                            const updated = [...selectedQuizDetail.resultOptions];
                            updated[resIdx].backgroundColor = e.target.value;
                            setSelectedQuizDetail({ ...selectedQuizDetail, resultOptions: updated });
                          }}
                          className="flex-1 bg-gray-950 border border-gray-800 px-3 py-1.5 rounded-lg text-xs focus:outline-none focus:border-red-500 font-mono text-center"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-400">CTA Button Text</label>
                      <input
                        type="text"
                        value={resOption.ctaText}
                        onChange={(e) => {
                          const updated = [...selectedQuizDetail.resultOptions];
                          updated[resIdx].ctaText = e.target.value;
                          setSelectedQuizDetail({ ...selectedQuizDetail, resultOptions: updated });
                        }}
                        className="w-full bg-gray-950 border border-gray-800 px-3 py-2 mt-1 rounded-lg text-xs focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] uppercase font-bold text-gray-400">CTA Redirect URL (Optional)</label>
                      <input
                        type="text"
                        value={resOption.ctaUrl || ''}
                        onChange={(e) => {
                          const updated = [...selectedQuizDetail.resultOptions];
                          updated[resIdx].ctaUrl = e.target.value;
                          setSelectedQuizDetail({ ...selectedQuizDetail, resultOptions: updated });
                        }}
                        className="w-full bg-gray-950 border border-gray-800 px-3 py-2 mt-1 rounded-lg text-xs focus:outline-none focus:border-red-500 font-mono text-yellow-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveResult(resOption)}
                    className="self-start bg-green-600 hover:bg-green-500 text-white font-extrabold text-[10px] py-2.5 px-4 rounded-lg uppercase tracking-wider flex items-center gap-1.5 mt-2 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Result Template #{resIdx + 1}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
