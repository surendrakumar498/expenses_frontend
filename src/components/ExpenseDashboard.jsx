import "../App.css";
import React, { useEffect, useState } from "react";
import { MoonLoader } from "react-spinners";

const ExpenseDashboard = () => {
  const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api/expenses`;

  const [originalLoading, setOriginalLoading] = useState(false);
  const [revisedLoading, setRevisedLoading] = useState(false);

  const [currentDateTime, setCurrentDateTime] = useState("");

  const [previewImage, setPreviewImage] = useState("");
  const [showModal, setShowModal] = useState(false);

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

  // TABLE DATA

  const [originalData, setOriginalData] = useState([]);
  const [revisedData, setRevisedData] = useState([]);

  // GET ALL EXPENSES

  const getExpenses = async () => {
    try {
      const response = await fetch(`${API_URL}/all`);

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

  // CLOUDINARY DOWNLOAD URL
  const getDownloadUrl = (url) => {
    return url.replace("/upload/", "/upload/fl_attachment/");
  };

  // ORIGINAL SUBMIT

  const handleOriginalSubmit = async () => {
    // VALIDATION
    if (!originalAmount || !originalTime || !originalDate || !originalFile) {
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
      formData.append("file", originalFile);

      const response = await fetch(`${API_URL}/create`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        await getExpenses();
        // Reset Form
        setOriginalAmount("");
        setOriginalTime("");
        setOriginalAmPm("AM");
        setOriginalDate("");
        setOriginalFile(null);

        alert("Original Expense Added");
      }
    } catch (error) {
      console.log(error);
    } finally {
      // Loader Stop
      setOriginalLoading(false);
    }
  };

  // REVISED SUBMIT

  const handleRevisedSubmit = async () => {
    // VALIDATION
    if (!revisedAmount || !revisedTime || !revisedDate || !revisedFile) {
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
      formData.append("file", revisedFile);

      const response = await fetch(`${API_URL}/create`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        await getExpenses();

        // Reset Form
        setRevisedAmount("");
        setRevisedTime("");
        setRevisedAmPm("AM");
        setRevisedDate("");
        setRevisedFile(null);

        alert("Revised Expense Added");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setRevisedLoading(false);
    }
  };
  // DELETE EXPENSE

 const handleDelete = async (id) => {
  try {
    const response = await fetch(`${API_URL}/delete/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (data.success) {
      setOriginalData((prev) =>
        prev.filter((item) => item._id !== id)
      );
      setRevisedData((prev) =>
        prev.filter((item) => item._id !== id)
      );
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

        <span className="live-date-time">{currentDateTime}</span>
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
            </div>
          </div>

          <div className="btn-wrapper">
            <button onClick={handleOriginalSubmit} disabled={originalLoading}>
              Submit
            </button>
          </div>

          <div className="data-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Download</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {originalData.map((item, index) => (
                  <tr key={index}>
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
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            </div>
          </div>

          <div className="btn-wrapper">
            <button onClick={handleRevisedSubmit} disabled={revisedLoading}>
              Submit
            </button>
          </div>

          <div className="data-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Amount</th>
                  <th>Time</th>
                  <th>Date</th>
                  <th>Download</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {revisedData.map((item, index) => (
                  <tr key={index}>
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
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(item._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
