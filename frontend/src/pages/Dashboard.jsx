import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../utils/axios';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [publicQuestions, setPublicQuestions] = useState([]);
  const [myQuestions, setMyQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answerContent, setAnswerContent] = useState('');
  const [currentAnsweringQuestion, setCurrentAnsweringQuestion] = useState(null);
  const navigate = useNavigate();

  const user = useMemo(() => {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'admin') {
      navigate('/admin');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        if (activeTab === 'home') {
          const response = await API.get('/questions/public');
          setPublicQuestions(response.data);
        } else if (activeTab === 'my-questions') {
          const response = await API.get('/questions/my-questions');
          setMyQuestions(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        alert('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeTab, user, navigate]);

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await API.delete(`/questions/${questionId}`);
      setMyQuestions(myQuestions.filter(q => q._id !== questionId));
      alert('Question deleted successfully');
    } catch (err) {
      console.error('Failed to delete question', err);
      alert('Failed to delete question. Please try again.');
    }
  };

  const handleAnswerSubmit = async (questionId) => {
    if (!answerContent.trim()) {
      alert('Please enter an answer');
      return;
    }

    try {
      const response = await API.post(`/answers/${questionId}`, { 
        content: answerContent 
      });
      
      const updatedPublicQuestions = publicQuestions.map(q => {
        if (q._id === questionId) {
          return {
            ...q,
            answers: [...(q.answers || []), response.data]
          };
        }
        return q;
      });
      setPublicQuestions(updatedPublicQuestions);

      const updatedMyQuestions = myQuestions.map(q => {
        if (q._id === questionId) {
          return {
            ...q,
            answers: [...(q.answers || []), response.data]
          };
        }
        return q;
      });
      setMyQuestions(updatedMyQuestions);

      setAnswerContent('');
      setCurrentAnsweringQuestion(null);
      alert('Answer submitted successfully');
    } catch (err) {
      console.error('Failed to submit answer', err);
      alert(err.response?.data?.message || 'Failed to submit answer');
    }
  };

  const handleAcceptAnswer = async (questionId, answerId) => {
    try {
      await API.patch(`/answers/${answerId}/accept`);
      
      const updatedPublicQuestions = publicQuestions.map(q => {
        if (q._id === questionId) {
          return {
            ...q,
            answers: q.answers.map(a => 
              a._id === answerId 
                ? {...a, isAccepted: true} 
                : {...a, isAccepted: false}
            )
          };
        }
        return q;
      });
      setPublicQuestions(updatedPublicQuestions);

      const updatedMyQuestions = myQuestions.map(q => {
        if (q._id === questionId) {
          return {
            ...q,
            answers: q.answers.map(a => 
              a._id === answerId 
                ? {...a, isAccepted: true} 
                : {...a, isAccepted: false}
            )
          };
        }
        return q;
      });
      setMyQuestions(updatedMyQuestions);

    } catch (err) {
      console.error('Failed to accept answer', err);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center">
              <div className="bg-blue-600 text-white p-2 rounded-lg mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Question Bank</h1>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 font-medium">Welcome, {user?.name}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 transition-all duration-200 shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'home' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                <span>Home</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('my-questions')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'my-questions' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span>My Questions</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ask')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'ask' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Ask a Question</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Home Tab - Public Questions */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">Public Questions</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {publicQuestions.length} questions
                  </span>
                </div>
                
                {publicQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No public questions available</h3>
                    <p className="mt-1 text-gray-500">Be the first to ask a question!</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setActiveTab('ask')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Ask a Question
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
                    {publicQuestions.map((question) => (
                      <div key={question._id} className="bg-white shadow overflow-hidden sm:rounded-lg transition-all duration-200 hover:shadow-md">
                        <div className="px-4 py-5 sm:px-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{question.title}</h3>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${question.isPublic ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                              {question.isPublic ? 'Public' : 'Private'}
                            </span>
                          </div>
                          <div className="mt-1 max-w-2xl text-sm text-gray-500">
                            <p>{question.description}</p>
                          </div>
                          <div className="mt-4 flex items-center text-sm text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span>Posted by: {question.user?.name || 'Anonymous'}</span>
                          </div>
                        </div>
                        
                        {/* Answer form */}
                        {currentAnsweringQuestion === question._id ? (
                          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                              Your Answer
                            </label>
                            <div className="mt-1">
                              <textarea
                                id="answer"
                                name="answer"
                                rows={4}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="Write your detailed answer here..."
                                value={answerContent}
                                onChange={(e) => setAnswerContent(e.target.value)}
                              />
                            </div>
                            <div className="mt-3 flex justify-end space-x-3">
                              <button
                                onClick={() => setCurrentAnsweringQuestion(null)}
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAnswerSubmit(question._id)}
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Submit Answer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end">
                            <button
                              onClick={() => setCurrentAnsweringQuestion(question._id)}
                              type="button"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                              </svg>
                              Answer This Question
                            </button>
                          </div>
                        )}

                        {/* Existing answers */}
                        {question.answers?.length > 0 && (
                          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Answers ({question.answers.length})</h4>
                            <div className="space-y-4">
                              {question.answers.map((answer) => (
                                <div
                                  key={answer._id}
                                  className={`p-4 rounded-lg ${answer.isAccepted ? 'border-2 border-green-500 bg-green-50' : 'border border-gray-200 bg-white'}`}
                                >
                                  <div className="flex justify-between">
                                    <p className="text-sm text-gray-700">{answer.content}</p>
                                    {answer.isAccepted && (
                                      <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Accepted
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-2 flex items-center text-xs text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span>Answered by: {answer.user?.name || 'User'}</span>
                                    {answer.user?._id === user._id && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  {question.user?._id === user._id && !answer.isAccepted && (
                                    <div className="mt-3">
                                      <button
                                        onClick={() => handleAcceptAnswer(question._id, answer._id)}
                                        type="button"
                                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Accept Answer
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Questions Tab */}
            {activeTab === 'my-questions' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-gray-800">My Questions</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {myQuestions.length} questions
                  </span>
                </div>
                
                {myQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">You haven't asked any questions yet</h3>
                    <p className="mt-1 text-gray-500">Get started by asking your first question.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setActiveTab('ask')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Ask a Question
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
                    {myQuestions.map((question) => (
                      <div key={question._id} className="bg-white shadow overflow-hidden sm:rounded-lg transition-all duration-200 hover:shadow-md">
                        <div className="px-4 py-5 sm:px-6">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">{question.title}</h3>
                            <div className="flex space-x-2">
                              <Link
                                to={`/edit-question/${question._id}`}
                                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-1.5 h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteQuestion(question._id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-1.5 h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Delete
                              </button>
                            </div>
                          </div>
                          <div className="mt-1 max-w-2xl text-sm text-gray-500">
                            <p>{question.description}</p>
                          </div>
                          <div className="mt-4 flex items-center space-x-4">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${question.isPublic ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                              {question.isPublic ? 'Public' : 'Private'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {question.answers?.length || 0} answers
                            </span>
                          </div>
                        </div>
                        
                        {/* Answer form for my questions */}
                        {currentAnsweringQuestion === question._id ? (
                          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
                              Your Answer
                            </label>
                            <div className="mt-1">
                              <textarea
                                id="answer"
                                name="answer"
                                rows={4}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="Write your detailed answer here..."
                                value={answerContent}
                                onChange={(e) => setAnswerContent(e.target.value)}
                              />
                            </div>
                            <div className="mt-3 flex justify-end space-x-3">
                              <button
                                onClick={() => setCurrentAnsweringQuestion(null)}
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAnswerSubmit(question._id)}
                                type="button"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                Submit Answer
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end">
                            <button
                              onClick={() => setCurrentAnsweringQuestion(question._id)}
                              type="button"
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                              </svg>
                              Add Answer
                            </button>
                          </div>
                        )}

                        {/* Answers to my questions */}
                        {question.answers?.length > 0 && (
                          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Answers ({question.answers.length})</h4>
                            <div className="space-y-4">
                              {question.answers.map((answer) => (
                                <div
                                  key={answer._id}
                                  className={`p-4 rounded-lg ${answer.isAccepted ? 'border-2 border-green-500 bg-green-50' : 'border border-gray-200 bg-white'}`}
                                >
                                  <div className="flex justify-between">
                                    <p className="text-sm text-gray-700">{answer.content}</p>
                                    {answer.isAccepted && (
                                      <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 ml-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Accepted
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-2 flex items-center text-xs text-gray-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0 mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span>Answered by: {answer.user?.name || 'User'}</span>
                                    {answer.user?._id === user._id && (
                                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  {!answer.isAccepted && (
                                    <div className="mt-3">
                                      <button
                                        onClick={() => handleAcceptAnswer(question._id, answer._id)}
                                        type="button"
                                        className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="-ml-0.5 mr-1 h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                        Accept Answer
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ask a Question Tab */}
            {activeTab === 'ask' && (
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Ask a Question</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Fill out the form below to submit your question to the community.
                  </p>
                </div>
                <div className="px-4 py-5 sm:p-6">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const data = {
                      title: formData.get('title'),
                      description: formData.get('description'),
                      isPublic: formData.get('isPublic') === 'on',
                    };

                    try {
                      const response = await API.post('/questions', data);
                      setMyQuestions([response.data, ...myQuestions]);
                      alert('Question submitted successfully!');
                      e.target.reset();
                      setActiveTab('my-questions');
                    } catch (err) {
                      console.error('Failed to submit question', err);
                      alert(
                        err.response?.data?.message ||
                          'Failed to submit question'
                      );
                    }
                  }}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Question Title
                        </label>
                        <div className="mt-1">
                          <input
                            type="text"
                            name="title"
                            id="title"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="What's your question?"
                            required
                          />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Be specific and imagine you're asking a question to another person.
                        </p>
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                          Detailed Description
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="description"
                            name="description"
                            rows={6}
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                            placeholder="Provide detailed information about your question..."
                            required
                          ></textarea>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                          Include all the information someone would need to answer your question.
                        </p>
                      </div>

                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="isPublic"
                            name="isPublic"
                            type="checkbox"
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            defaultChecked
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="isPublic" className="font-medium text-gray-700">
                            Make this question public
                          </label>
                          <p className="text-gray-500">
                            Public questions can be viewed and answered by anyone in the community.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2zM7 8H5v2h2V8zm2 0h2v2H9V8zm6 0h-2v2h2V8z" clipRule="evenodd" />
                          </svg>
                          Submit Question
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}