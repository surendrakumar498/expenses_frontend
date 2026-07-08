import "../App.css";
import React, { useEffect, useState, useRef } from "react";
import { MoonLoader } from "react-spinners";

const ITEMS_PER_PAGE = 5;

const ExpenseDashboard = ({ user, onLogout }) => {
  const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/expenses`;

  // Har request me bhejne wala Authorization header
  const authHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const [originalLoading, setOriginalLoading] = useState(false);
  const [revisedLoading, setRevisedLoading] = useState(false);

  const [currentDateTime, setCurrentDateTime] = useState("");

  const [previewImage, setPreviewImage] = useState("");
  const [showModal, setShowModal] = useState(false);

  // USER ICON POPUP (naya)
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  // ORIGINAL STATES
  const [originalAmount, setOriginalAmount] = useState("");
  const [originalTime, setOriginalTime] = useState("");
  const [originalAmPm, setOriginalAmPm] = useState("AM");
  const [originalDate, setOriginalDate] = useState("");
  const [originalFile, setOriginalFile] = useState(null);

  // REVISED STATES

  const [revisedAmount, setRevisedAmount] = useState("");
  const [revisedTime, setRevisedTime] = useState("");
  const [revisedAmPm, setRevisedAmPm] = useState("AM");
  const [revisedDate, setRevisedDate] = useState("");
  const [revisedFile, setRevisedFile] = useState(null);

  // EDIT MODE STATES (naya)
  const [editingOriginalId, setEditingOriginalId] = useState(null);
  const [editingRevisedId, setEditingRevisedId] = useState(null);

  // TABLE DATA

  const [originalData, setOriginalData] = useState([]);
  const [revisedData, setRevisedData] = useState([]);

  // PAGINATION STATES (naya)
  const [originalPage, setOriginalPage] = useState(1);
  const [revisedPage, setRevisedPage] = useState(1);

  // TOTALS (derived from table data)
  const getTotal = (data) =>
    data.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const originalTotal = getTotal(originalData);
  const revisedTotal = getTotal(revisedData);

  // PAGINATION HELPERS (naya)
  const getTotalPages = (data) => Math.max(1, Math.ceil(data.length / ITEMS_PER_PAGE));

  const getPageData = (data, page) => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };

  const originalTotalPages = getTotalPages(originalData);
  const revisedTotalPages = getTotalPages(revisedData);

  const paginatedOriginalData = getPageData(originalData, originalPage);
  const paginatedRevisedData = getPageData(revisedData, revisedPage);

  // Agar data delete/update hone ke baad current page khaali ho jaye, to pichhle page pe chala jaye
  useEffect(() => {
    if (originalPage > originalTotalPages) setOriginalPage(originalTotalPages);
  }, [originalData, originalPage, originalTotalPages]);

  useEffect(() => {
    if (revisedPage > revisedTotalPages) setRevisedPage(revisedTotalPages);
  }, [revisedData, revisedPage, revisedTotalPages]);

  // GET ALL EXPENSES

  const getExpenses = async () => {
    try {
      const response = await fetch(`${API_URL}/all`, {
        headers: { ...authHeader() },
      });

      // Token expire ya invalid ho gaya to auto logout
      if (response.status === 401) {
        onLogout();
        return;
      }

      const data = await response.json();

      if (data.success) {
        const original = data.data.filter((item) => item.type === "original");

        const revised = data.data.filter((item) => item.type === "revised");

        setOriginalData(original);
        setRevisedData(revised);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // PAGE LOAD

  useEffect(() => {
    getExpenses();
  }, []);

  // USER MENU: BAHAR CLICK KARNE PE BAND HO JAYE
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // CLOUDINARY DOWNLOAD URL
  const getDownloadUrl = (url) => {
    return url.replace("/upload/", "/upload/fl_attachment/");
  };

  // Helper: split "hh:mm AM/PM" style time string back into time + ampm
  const splitTime = (timeStr = "") => {
    const parts = timeStr.trim().split(" ");
    if (parts.length === 2) {
      return { time: parts[0], ampm: parts[1].toUpperCase() };
    }
    return { time: timeStr, ampm: "AM" };
  };

  // ============ ORIGINAL: EDIT / SUBMIT / CANCEL ============

  // EDIT BUTTON CLICK -> POPULATE FORM
  const handleEditOriginal = (item) => {
    const { time, ampm } = splitTime(item.time);

    setOriginalAmount(item.amount);
    setOriginalTime(time);
    setOriginalAmPm(ampm);
    setOriginalDate(item.date);
    setOriginalFile(null); // naya file optional hai, purana file backend me retain hoga
    setEditingOriginalId(item._id);
  };

  // CANCEL EDIT
  const handleCancelEditOriginal = () => {
    setOriginalAmount("");
    setOriginalTime("");
    setOriginalAmPm("AM");
    setOriginalDate("");
    setOriginalFile(null);
    setEditingOriginalId(null);
  };

  // ORIGINAL SUBMIT (CREATE OR UPDATE)

  const handleOriginalSubmit = async () => {
    // VALIDATION - edit mode me file optional hai
    if (
      !originalAmount ||
      !originalTime ||
      !originalDate ||
      (!editingOriginalId && !originalFile)
    ) {
      alert("Please fill all Original fields");
      return;
    }

    try {
      // Loader Start
      setOriginalLoading(true);

      const formData = new FormData();

      formData.append("type", "original");
      formData.append("amount", originalAmount);
      formData.append("time", `${originalTime} ${originalAmPm}`);
      formData.append("date", originalDate);
      if (originalFile) {
        formData.append("file", originalFile);
      }

      const isEditing = Boolean(editingOriginalId);

      const response = await fetch(
        isEditing ? `${API_URL}/update/${editingOriginalId}` : `${API_URL}/create`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { ...authHeader() },
          body: formData,
        }
      );

      if (response.status === 401) {
        onLogout();
        return;
      }

      // Agar route hi exist nahi karta (404) ya server error (500) aaye
      if (!response.ok) {
        console.log(`Request failed with status ${response.status}`);
        alert(
          `Update failed (status ${response.status}). Check karo ki backend me PUT /update/:id route bana hai ya nahi.`
        );
        return;
      }

      const data = await response.json();

      if (data.success) {
        await getExpenses();
        // Reset Form
        setOriginalAmount("");
        setOriginalTime("");
        setOriginalAmPm("AM");
        setOriginalDate("");
        setOriginalFile(null);
        setEditingOriginalId(null);

        alert(isEditing ? "Original Expense Updated" : "Original Expense Added");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
      alert("Request failed: " + error.message);
    } finally {
      // Loader Stop
      setOriginalLoading(false);
    }
  };

  // ============ REVISED: EDIT / SUBMIT / CANCEL ============

  const handleEditRevised = (item) => {
    const { time, ampm } = splitTime(item.time);

    setRevisedAmount(item.amount);
    setRevisedTime(time);
    setRevisedAmPm(ampm);
    setRevisedDate(item.date);
    setRevisedFile(null);
    setEditingRevisedId(item._id);
  };

  const handleCancelEditRevised = () => {
    setRevisedAmount("");
    setRevisedTime("");
    setRevisedAmPm("AM");
    setRevisedDate("");
    setRevisedFile(null);
    setEditingRevisedId(null);
  };

  // REVISED SUBMIT (CREATE OR UPDATE)

  const handleRevisedSubmit = async () => {
    // VALIDATION - edit mode me file optional hai
    if (
      !revisedAmount ||
      !revisedTime ||
      !revisedDate ||
      (!editingRevisedId && !revisedFile)
    ) {
      alert("Please fill all Revised fields");
      return;
    }

    try {
      // Loader Start
      setRevisedLoading(true);

      const formData = new FormData();

      formData.append("type", "revised");
      formData.append("amount", revisedAmount);
      formData.append("time", `${revisedTime} ${revisedAmPm}`);
      formData.append("date", revisedDate);
      if (revisedFile) {
        formData.append("file", revisedFile);
      }

      const isEditing = Boolean(editingRevisedId);

      const response = await fetch(
        isEditing ? `${API_URL}/update/${editingRevisedId}` : `${API_URL}/create`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: { ...authHeader() },
          body: formData,
        }
      );

      if (response.status === 401) {
        onLogout();
        return;
      }

      // Agar route hi exist nahi karta (404) ya server error (500) aaye
      if (!response.ok) {
        console.log(`Request failed with status ${response.status}`);
        alert(
          `Update failed (status ${response.status}). Check karo ki backend me PUT /update/:id route bana hai ya nahi.`
        );
        return;
      }

      const data = await response.json();

      if (data.success) {
        await getExpenses();

        // Reset Form
        setRevisedAmount("");
        setRevisedTime("");
        setRevisedAmPm("AM");
        setRevisedDate("");
        setRevisedFile(null);
        setEditingRevisedId(null);

        alert(isEditing ? "Revised Expense Updated" : "Revised Expense Added");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch (error) {
      console.log(error);
      alert("Request failed: " + error.message);
    } finally {
      setRevisedLoading(false);
    }
  };
  // DELETE EXPENSE

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/delete/${id}`, {
        method: "DELETE",
        headers: { ...authHeader() },
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      const data = await response.json();

      if (data.success) {
        setOriginalData((prev) => prev.filter((item) => item._id !== id));
        setRevisedData((prev) => prev.filter((item) => item._id !== id));

        // Agar delete hui entry hi edit ho rahi thi, form reset kar do
        if (editingOriginalId === id) handleCancelEditOriginal();
        if (editingRevisedId === id) handleCancelEditRevised();
      }
    } catch (error) {
      console.log(error);
    }
  };

  /*DYNAMIC CLOCK */
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options = {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };

      const formattedDateTime = now
        .toLocaleString("en-IN", options)
        .replace("am", "AM")
        .replace("pm", "PM");
      setCurrentDateTime(formattedDateTime);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="memo-container">
      {(originalLoading || revisedLoading) && (
        <div className="loader-overlay">
          <div className="loader-circle">
            <MoonLoader size={55} color="#4a3aff" speedMultiplier={1} />
          </div>
        </div>
      )}
      <div className="top-header">
        <span className="memo-title">Finance Tracker</span>

        <div className="header-right">
          <span className="live-date-time">{currentDateTime}</span>

          <div className="user-menu-wrapper" ref={userMenuRef}>
            <button
              className="user-icon-btn"
              onClick={() => setShowUserMenu((prev) => !prev)}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "👤"}
            </button>

            {showUserMenu && (
              <div className="user-menu-popup">
                {user?.name && (
                  <p className="user-menu-name">{user.name}</p>
                )}
                {user?.email && (
                  <p className="user-menu-email">{user.email}</p>
                )}

                <button className="logout-btn" onClick={onLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        {/*  ORIGINAL  */}

        <div className="section">
          <div className="section-title">ORIGINAL</div>

          <div className="table-row heading">
            <div>Amount</div>
            <div>Time</div>
            <div>Date</div>
            <div>Upload File</div>
          </div>

          <div className="table-row body-row">
            <div className="table-cell">
              <input
                type="text"
                placeholder="Enter Amount"
                value={originalAmount}
                onChange={(e) => setOriginalAmount(e.target.value)}
              />
            </div>

            <div className="table-cell time-wrapper">
              <label className="mobile-label">Time</label>

              <input
                type="time"
                className="time-input"
                value={originalTime}
                onChange={(e) => setOriginalTime(e.target.value)}
              />
              <select
                className="am-pm-select"
                value={originalAmPm}
                onChange={(e) => setOriginalAmPm(e.target.value)}
              >
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>

            <div className="table-cell">
              <label className="mobile-label">Date</label>

              <input
                type="date"
                value={originalDate}
                onChange={(e) => setOriginalDate(e.target.value)}
              />
            </div>

            <div className="table-cell">
              <input
                type="file"
                onChange={(e) => setOriginalFile(e.target.files[0])}
              />

              {originalFile && <p className="file-name">{originalFile.name}</p>}
              {editingOriginalId && !originalFile && (
                <p className="file-name">(Purani file rahegi agar nayi na choose ki)</p>
              )}
            </div>
          </div>

          <div className="btn-wrapper">
            <button onClick={handleOriginalSubmit} disabled={originalLoading}>
              {editingOriginalId ? "Update" : "Submit"}
            </button>

            {editingOriginalId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancelEditOriginal}
                disabled={originalLoading}
              >
                Cancel
              </button>
            )}
          </div>

          <div className="data-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Amount</th>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Download</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedOriginalData.map((item, index) => (
                  <tr key={index}>
                    <td>{(originalPage - 1) * ITEMS_PER_PAGE + index + 1}</td>

                    <td>{item.amount}</td>

                    <td>{item.time}</td>

                    <td>{item.date}</td>

                    <td>
                      {item.file && (
                        <>
                          <div className="action-buttons">
                            {/* VIEW BUTTON */}

                            <button
                              className="preview-btn"
                              onClick={() => {
                                setPreviewImage(`${item.file}`);
                                setShowModal(true);
                              }}
                            >
                              View
                            </button>

                            {/* DOWNLOAD BUTTON */}
                            <a
                              href={getDownloadUrl(item.file)}
                              className="download-btn"
                            >
                              Download
                            </a>
                          </div>

                          <br />
                        </>
                      )}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditOriginal(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {originalData.length > 0 && (
                <tfoot>
                  <tr className="total-row">
                    <td colSpan={1} style={{ fontWeight: "bold" }}>
                      Total
                    </td>
                    <td style={{ fontWeight: "bold" }}>
                      {originalTotal.toFixed(2)}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* PAGINATION CONTROLS (naya) */}
          {originalData.length > ITEMS_PER_PAGE && (
            <div className="pagination-controls">
              <button
                onClick={() => setOriginalPage((p) => Math.max(1, p - 1))}
                disabled={originalPage === 1}
              >
                Prev
              </button>

              <span className="pagination-info">
                Page {originalPage} of {originalTotalPages}
              </span>

              <button
                onClick={() => setOriginalPage((p) => Math.min(originalTotalPages, p + 1))}
                disabled={originalPage === originalTotalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/*  REVISED  */}

        <div className="section">
          <div className="section-title">Revised</div>

          <div className="table-row heading">
            <div>Amount</div>
            <div>Time</div>
            <div>Date</div>
            <div>Upload File</div>
          </div>

          <div className="table-row body-row">
            <div className="table-cell">
              <input
                type="text"
                placeholder="Enter Amount"
                value={revisedAmount}
                onChange={(e) => setRevisedAmount(e.target.value)}
              />
            </div>

            <div className="table-cell time-wrapper">
              <input
                type="time"
                className="time-input"
                value={revisedTime}
                onChange={(e) => setRevisedTime(e.target.value)}
              />

              <select
                className="am-pm-select"
                value={revisedAmPm}
                onChange={(e) => setRevisedAmPm(e.target.value)}
              >
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>

            <div className="table-cell">
              <input
                type="date"
                value={revisedDate}
                onChange={(e) => setRevisedDate(e.target.value)}
              />
            </div>

            <div className="table-cell">
              <input
                type="file"
                onChange={(e) => setRevisedFile(e.target.files[0])}
              />

              {revisedFile && <p className="file-name">{revisedFile.name}</p>}
              {editingRevisedId && !revisedFile && (
                <p className="file-name">(Purani file rahegi agar nayi na choose ki)</p>
              )}
            </div>
          </div>

          <div className="btn-wrapper">
            <button onClick={handleRevisedSubmit} disabled={revisedLoading}>
              {editingRevisedId ? "Update" : "Submit"}
            </button>

            {editingRevisedId && (
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancelEditRevised}
                disabled={revisedLoading}
              >
                Cancel
              </button>
            )}
          </div>

          <div className="data-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Amount</th>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Download</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {paginatedRevisedData.map((item, index) => (
                  <tr key={index}>
                    <td>{(revisedPage - 1) * ITEMS_PER_PAGE + index + 1}</td>

                    <td>{item.amount}</td>

                    <td>{item.time}</td>

                    <td>{item.date}</td>

                    <td>
                      {item.file && (
                        <>
                          <div className="action-buttons">
                            {/* VIEW BUTTON */}
                            <button
                              className="preview-btn"
                              onClick={() => {
                                setPreviewImage(`${item.file}`);
                                setShowModal(true);
                              }}
                            >
                              View
                            </button>

                            {/* DOWNLOAD BUTTON */}
                            <a
                              href={getDownloadUrl(item.file)}
                              className="download-btn"
                            >
                              Download
                            </a>
                          </div>

                          <br />
                        </>
                      )}
                    </td>

                    <td>
                      <div className="action-buttons">
                        <button
                          className="edit-btn"
                          onClick={() => handleEditRevised(item)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>

              {revisedData.length > 0 && (
                <tfoot>
                  <tr className="total-row">
                    <td colSpan={1} style={{ fontWeight: "bold" }}>
                      Total
                    </td>
                    <td style={{ fontWeight: "bold" }}>
                      {revisedTotal.toFixed(2)}
                    </td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* PAGINATION CONTROLS (naya) */}
          {revisedData.length > ITEMS_PER_PAGE && (
            <div className="pagination-controls">
              <button
                onClick={() => setRevisedPage((p) => Math.max(1, p - 1))}
                disabled={revisedPage === 1}
              >
                Prev
              </button>

              <span className="pagination-info">
                Page {revisedPage} of {revisedTotalPages}
              </span>

              <button
                onClick={() => setRevisedPage((p) => Math.min(revisedTotalPages, p + 1))}
                disabled={revisedPage === revisedTotalPages}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
      {/* IMAGE MODAL */}

      {showModal && (
        <div className="image-modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowModal(false)}>
              ✖
            </button>

            <img src={previewImage} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseDashboard;
