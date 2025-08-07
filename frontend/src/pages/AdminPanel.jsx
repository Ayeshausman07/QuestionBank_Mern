import { useEffect, useState } from "react";
import API from "../utils/axios";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [answerContent, setAnswerContent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "questions") {
      fetchQuestions();
    }
  }, [activeTab]);

  const fetchUsers = () => {
    setLoading(true);
    API.get("/auth/users")
      .then((response) => setUsers(response.data))
      .catch((err) => {
        console.error("Failed to fetch users", err);
        alert("Failed to load users. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  const fetchQuestions = () => {
    setLoading(true);
    API.get("/questions")
      .then((response) => setQuestions(response.data))
      .catch((err) => {
        console.error("Failed to fetch questions", err);
        alert("Failed to load questions. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  const handleBlockUser = async (userId, isCurrentlyBlocked) => {
    if (isCurrentlyBlocked) {
      try {
        await API.put(`/auth/users/${userId}/block`, { reason: "" });
        fetchUsers();
      } catch (err) {
        console.error("Failed to unblock user", err);
        alert(err.response?.data?.message || "Failed to unblock user");
      }
    } else {
      setCurrentUserId(userId);
      document.getElementById("blockModal").showModal();
    }
  };

  const confirmBlock = async () => {
    if (!blockReason.trim()) {
      alert("Please provide a reason for blocking");
      return;
    }

    try {
      await API.put(`/auth/users/${currentUserId}/block`, {
        reason: blockReason,
      });
      fetchUsers();
      setBlockReason("");
      document.getElementById("blockModal").close();
    } catch (err) {
      console.error("Failed to block user", err);
      alert(err.response?.data?.message || "Failed to block user");
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await API.delete(`/questions/admin/${questionId}`);
      fetchQuestions();
      alert("Question deleted successfully");
    } catch (adminError) {
      console.log("Admin delete failed, trying regular delete", adminError);
      
      try {
        await API.delete(`/questions/${questionId}`);
        fetchQuestions();
        alert("Question deleted successfully");
      } catch (regularError) {
        console.error("All deletion attempts failed:", regularError);
        const errorMsg = regularError.response?.data?.message || 
                        "Failed to delete question. Please try again.";
        alert(errorMsg);
      }
    }
  };

  const handleAnswerSubmit = async (questionId) => {
    if (!answerContent.trim()) {
      alert("Please enter an answer");
      return;
    }

    try {
      await API.post(`/answers/${questionId}`, { content: answerContent });
      setAnswerContent("");
      setCurrentQuestionId(null);
      fetchQuestions();
      alert("Answer submitted successfully");
    } catch (err) {
      console.error("Failed to submit answer", err);
      alert(err.response?.data?.message || "Failed to submit answer");
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm("Are you sure you want to delete this answer?")) return;

    try {
      await API.delete(`/answers/${answerId}`);
      setQuestions(prev => prev.map(q => ({
        ...q,
        answers: q.answers?.filter(a => a._id !== answerId) || []
      })));
      alert("Answer deleted successfully");
    } catch (err) {
      console.error("Delete error:", err.response?.data);
      alert(err.response?.data?.message || "Failed to delete answer");
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Block User Modal */}
      <dialog id="blockModal" className="modal">
        <div className="modal-box bg-white p-6 rounded-lg shadow-xl max-w-md border border-blue-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-blue-800">Block User</h3>
              <p className="text-gray-600 mt-1">
                Provide a reason for blocking this user
              </p>
            </div>
            <button
              onClick={() => {
                document.getElementById("blockModal").close();
                setBlockReason("");
              }}
              className="btn btn-sm btn-circle btn-ghost text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <textarea
            className="textarea w-full h-32 p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            placeholder="Example: Violation of community guidelines..."
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
          />

          <div className="modal-action mt-6 flex justify-end space-x-3">
            <button
              onClick={() => {
                document.getElementById("blockModal").close();
                setBlockReason("");
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmBlock}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                  clipRule="evenodd"
                />
              </svg>
              Confirm Block
            </button>
          </div>
        </div>

        {/* Backdrop click to close */}
        <form method="dialog" className="modal-backdrop bg-black bg-opacity-50">
          <button>close</button>
        </form>
      </dialog>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-800">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users and questions</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
            </svg>
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-4">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "users" ? "bg-blue-100 text-blue-700 border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700 hover:bg-blue-50"}`}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === "questions" ? "bg-blue-100 text-blue-700 border-b-2 border-blue-500" : "text-gray-500 hover:text-gray-700 hover:bg-blue-50"}`}
              onClick={() => setActiveTab("questions")}
            >
              Questions
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === "users" && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">User Management</h2>
                  <p className="text-gray-600 text-sm">Manage all registered users</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Reason
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {user.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${
                                  user.isBlocked
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                            >
                              {user.isBlocked ? "Blocked" : "Active"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.blockedReason || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() =>
                                handleBlockUser(user._id, user.isBlocked)
                              }
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
                                ${
                                  user.isBlocked
                                    ? "bg-green-500 hover:bg-green-600 text-white"
                                    : "bg-red-500 hover:bg-red-600 text-white"
                                }`}
                            >
                              {user.isBlocked ? "Unblock" : "Block"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "questions" && (
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Question Management</h2>
                  <p className="text-gray-600 text-sm">View and manage all questions</p>
                </div>
                
                {questions.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No questions found</h3>
                    <p className="mt-1 text-gray-500">There are no questions in the database yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {questions.map((question) => (
                      <div key={question._id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-blue-800">{question.title}</h3>
                              <p className="text-gray-600 mt-1">{question.description}</p>
                              <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-500">
                                <span className="inline-flex items-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                  {question.user?.name || "Unknown"}
                                </span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  question.isPublic ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                                }`}>
                                  {question.isPublic ? "Public" : "Private"}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(question._id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>

                        <div className="p-4">
                          {currentQuestionId === question._id ? (
                            <div className="mt-2">
                              <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                placeholder="Enter your answer..."
                                value={answerContent}
                                onChange={(e) => setAnswerContent(e.target.value)}
                                rows={3}
                              ></textarea>
                              <div className="flex justify-end space-x-2 mt-2">
                                <button
                                  onClick={() => setCurrentQuestionId(null)}
                                  className="px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAnswerSubmit(question._id)}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                >
                                  Submit Answer
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCurrentQuestionId(question._id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Answer
                            </button>
                          )}

                          {question.answers?.length > 0 && (
                            <div className="mt-4">
                              <h4 className="font-medium text-gray-700 mb-2">Answers ({question.answers.length})</h4>
                              <div className="space-y-3">
                                {question.answers.map((answer) => (
                                  <div
                                    key={answer._id}
                                    className={`p-3 border rounded-lg ${
                                      answer.isAccepted
                                        ? "border-green-500 bg-green-50"
                                        : "border-gray-200 bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start gap-2">
                                      <p className="text-gray-700">{answer.content}</p>
                                      <button
                                        onClick={() => handleDeleteAnswer(answer._id)}
                                        className="text-red-600 hover:text-red-800 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                      Answered by: {answer.user?.name || "Admin"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}