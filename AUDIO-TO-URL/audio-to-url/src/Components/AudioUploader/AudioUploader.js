import React, { useState, useRef, useEffect } from "react";
import "./AudioUploader.css";
import axios from "axios";

const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const AudioUploader = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState(
    localStorage.getItem("recordedAudio") || null
  );
  const [selectedAudio, setSelectedAudio] = useState(
    localStorage.getItem("selectedAudio") || null
  );
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    recordedAudio
      ? localStorage.setItem("recordedAudio", recordedAudio)
      : localStorage.removeItem("recordedAudio");
  }, [recordedAudio]);

  useEffect(() => {
    selectedAudio
      ? localStorage.setItem("selectedAudio", selectedAudio)
      : localStorage.removeItem("selectedAudio");
  }, [selectedAudio]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const base64 = await blobToBase64(blob);
        setRecordedAudio(base64);
        setSelectedAudio(null); // clear existing file
        chunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      alert("Microphone access is required to record audio.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const base64 = await blobToBase64(file);
      setSelectedAudio(base64);
      setRecordedAudio(null); // clear recorded audio
    }
  };

  const deleteRecordedAudio = () => setRecordedAudio(null);
  const deleteSelectedAudio = () => setSelectedAudio(null);

  const handleUpload = async (source) => {
    try {
      const audioBlob = await fetch(source).then((res) => res.blob());
      const file = new File([audioBlob], "audio.webm", {
        type: "audio/webm",
      });

      const formData = new FormData();
      formData.append("audio", file);

      const res = await axios.post(
        "http://localhost:5000/upload-audio",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.data.success) {
        alert("✅ Audio uploaded successfully!");
      } else {
        alert("❌ Upload failed.");
      }
    } catch (err) {
      console.error(err);
      alert("⚠️ Something went wrong during upload.");
    }
  };

  return (
    <div className="audio-container">
      <h2>🎙️ Audio Recorder & Uploader</h2>

      <div className="section">
        <h3>Live Recording</h3>
        {!isRecording ? (
          <button className="btn record-btn" onClick={startRecording}>
            Start Recording
          </button>
        ) : (
          <button className="btn stop-btn" onClick={stopRecording}>
            Stop Recording
          </button>
        )}

        {recordedAudio && (
          <>
            <p>🔊 Preview Recorded Audio:</p>
            <audio controls src={recordedAudio} />
            <br />
            <button
              className="btn upload-btn"
              onClick={() => handleUpload(recordedAudio)}
            >
              Upload Audio
            </button>
            <button className="btn delete-btn" onClick={deleteRecordedAudio}>
              Delete Recording
            </button>
          </>
        )}
      </div>

      <hr className="divider" />

      <div className="section">
        <h3>Upload Existing Audio</h3>
        <input type="file" accept="audio/*" onChange={handleFileChange} />
        {selectedAudio && (
          <>
            <p>🔊 Preview Selected Audio:</p>
            <audio controls src={selectedAudio} />
            <br />
            <button
              className="btn upload-btn"
              onClick={() => handleUpload(selectedAudio)}
            >
              Upload Audio
            </button>
            <button className="btn delete-btn" onClick={deleteSelectedAudio}>
              Delete File
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioUploader;
