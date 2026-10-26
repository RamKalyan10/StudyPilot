import { useState } from 'react';
import {
  BookOpen,
  Upload,
  Check,
  X,
  Sparkles,
  Layers,
  Clock,
  Target,
  Trash2,
  Plus,
  AlertCircle,
  Loader2,
  FileCheck
} from 'lucide-react';
import { extractDocumentText } from '../utils/docExtractor';

export const SAMPLE_DSA_SYLLABUS = `UNIT I: Linear Data Structures
Abstract Data Types (ADTs), List ADT, Array implementation, Linked List implementation, Singly Linked Lists, Doubly Linked Lists, Circular Linked Lists, Applications of Lists: Polynomial Manipulation.

UNIT II: Stacks and Queues
Stack ADT, Array and Linked List implementation of Stacks, Applications of Stacks: Infix to Postfix expression conversion, Postfix evaluation, Balancing parenthesis. Queue ADT, Circular Queue, Deque, Priority Queue implementation, Applications of Queues.

UNIT III: Non-Linear Data Structures - Trees
Tree ADT, Binary Tree ADT, Tree Traversals (Inorder, Preorder, Postorder, Level order), Binary Search Trees (BST), Insertion, Deletion and Searching in BST, Balanced Trees: AVL Trees, Rotations in AVL, B-Trees, B+ Trees.

UNIT IV: Graphs and Network Algorithms
Graph ADT, Representations: Adjacency Matrix and Adjacency List, Graph Traversals: Depth First Search (DFS), Breadth First Search (BFS), Topological Sorting, Minimum Spanning Trees: Prim's and Kruskal's algorithms, Shortest Path: Dijkstra's Algorithm.

UNIT V: Sorting, Searching and Hashing
Sorting Algorithms: Insertion Sort, Selection Sort, Merge Sort, Quick Sort, Heap Sort, Complexity Analysis. Searching: Linear Search, Binary Search. Hashing: Hash Functions, Collision Resolution Techniques: Separate Chaining, Open Addressing, Linear Probing, Quadratic Probing.`;

export const SAMPLE_DBMS_SYLLABUS = `UNIT I: Introduction to Database Systems
Database system concepts and architecture, Data models, Schemas and Instances, Three-schema architecture, Data Independence, Entity-Relationship (ER) model, Enhanced ER (EER) modeling, Mapping ER models to Relational Schema.

UNIT II: Relational Data Model and SQL
Relational Model Concepts, Relational Constraints, Relational Algebra operations, SQL: DDL, DML, Complex queries, Nested subqueries, Joins, Views, Triggers, Integrity Constraints and Assertions.

UNIT III: Database Design and Normalization
Functional Dependencies, Inference Rules, Normal Forms: 1NF, 2NF, 3NF, Boyce-Codd Normal Form (BCNF), Multi-valued dependencies and 4NF, Lossless join decomposition and Dependency preservation.

UNIT IV: Transaction Processing and Concurrency Control
Transaction concept, ACID properties, Transaction states, Concurrent executions, Serializability, Conflict and View Serializability, Concurrency Control Protocols: Lock-based protocols, Two-Phase Locking (2PL), Timestamp-based ordering, Deadlock detection and prevention.

UNIT V: Storage, Indexing and Query Optimization
Storage structures, File organization, Indexing techniques, Primary and Secondary Indexes, B-Tree and B+ Tree indexing, Hashing, Query Processing overview, Query Optimization heuristics, Database Recovery techniques.`;

export default function SyllabusModal({
  subject,
  existingSyllabus,
  subjects = [],
  onClose,
  onSaveSyllabus,
  onDeleteSyllabus,
  onCreateTasksFromSyllabus,
  busy = false
}) {
  const [activeTab, setActiveTab] = useState(existingSyllabus ? 'view' : 'upload'); // 'view' | 'upload'
  const [selectedSubjectId, setSelectedSubjectId] = useState(
    subject?._id || existingSyllabus?.subject?._id || subjects[0]?._id || ''
  );
  const [title, setTitle] = useState(
    existingSyllabus?.title || (subject ? `${subject.name} Syllabus` : 'Subject Syllabus')
  );
  const [rawText, setRawText] = useState(existingSyllabus?.rawText || '');
  const [fileName, setFileName] = useState(existingSyllabus?.fileName || '');
  const [checkedTopics, setCheckedTopics] = useState(new Set());
  const [convertingUnit, setConvertingUnit] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [docMeta, setDocMeta] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // File processing for any document type (.pdf, .docx, .txt, .md, etc.)
  const processFile = async (file) => {
    if (!file) return;
    setExtracting(true);
    setUploadError('');
    try {
      const result = await extractDocumentText(file);
      setRawText(result.text || '');
      setFileName(result.fileName || file.name);
      setDocMeta({
        detectedType: result.detectedType || (file.name.split('.').pop()?.toUpperCase() + ' Document'),
        pages: result.pages,
        totalUnits: result.totalUnits,
        totalTopics: result.totalTopics
      });
      // Suggest title if generic
      if (!title || title === 'Subject Syllabus' || title.endsWith('Syllabus')) {
        const cleanBase = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setTitle(`${cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1)} Syllabus`);
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to extract text from document.');
    } finally {
      setExtracting(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const loadSample = (sampleText, sampleTitle) => {
    setRawText(sampleText);
    setTitle(sampleTitle);
    setFileName('sample_syllabus.txt');
    setDocMeta({
      detectedType: 'Preset Syllabus Sample',
      totalUnits: 5,
      totalTopics: sampleText === SAMPLE_DSA_SYLLABUS ? 26 : 24
    });
    setUploadError('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!selectedSubjectId || !rawText.trim()) return;
    onSaveSyllabus({
      subjectId: selectedSubjectId,
      title,
      rawText,
      fileName: fileName || 'syllabus.txt'
    });
  };

  const toggleTopicCheck = (topicKey) => {
    const updated = new Set(checkedTopics);
    if (updated.has(topicKey)) {
      updated.delete(topicKey);
    } else {
      updated.add(topicKey);
    }
    setCheckedTopics(updated);
  };

  const handleConvertUnit = async (unitNumber) => {
    setConvertingUnit(unitNumber);
    try {
      await onCreateTasksFromSyllabus(existingSyllabus._id, [unitNumber]);
    } finally {
      setConvertingUnit(null);
    }
  };

  const handleConvertAll = async () => {
    setConvertingUnit('all');
    try {
      await onCreateTasksFromSyllabus(existingSyllabus._id, []);
    } finally {
      setConvertingUnit(null);
    }
  };

  const currentSubjectObj = subjects.find((s) => s._id === selectedSubjectId) || subject;
  const color = currentSubjectObj?.color || '#8b7cff';

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section className="modal syllabus-modal-container" style={{ '--subject-accent': color }}>
        <div className="modal-head">
          <div className="syllabus-modal-title">
            <BookOpen size={20} style={{ color }} />
            <div>
              <h3>{existingSyllabus ? existingSyllabus.title : 'Course Syllabus Analyzer'}</h3>
              <span className="syllabus-modal-sub">
                {currentSubjectObj ? currentSubjectObj.name : 'All Coursework'}
              </span>
            </div>
          </div>

          <div className="syllabus-head-actions">
            {existingSyllabus && (
              <div className="cal-view-toggle">
                <button
                  type="button"
                  className={`cal-view-btn ${activeTab === 'view' ? 'active' : ''}`}
                  onClick={() => setActiveTab('view')}
                >
                  View Summary
                </button>
                <button
                  type="button"
                  className={`cal-view-btn ${activeTab === 'upload' ? 'active' : ''}`}
                  onClick={() => setActiveTab('upload')}
                >
                  Update / Edit
                </button>
              </div>
            )}
            <button className="icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* VIEW EXISTING SYLLABUS SUMMARY */}
        {activeTab === 'view' && existingSyllabus && (
          <div className="syllabus-view-body">
            {/* Summary Metrics Bar */}
            <div className="syllabus-summary-bar">
              <div className="syl-stat">
                <Layers size={16} />
                <div>
                  <strong>{existingSyllabus.totalUnits || existingSyllabus.units?.length || 0}</strong>
                  <span>Course Units</span>
                </div>
              </div>

              <div className="syl-stat">
                <Target size={16} />
                <div>
                  <strong>{existingSyllabus.totalTopics || 0}</strong>
                  <span>Key Topics</span>
                </div>
              </div>

              <div className="syl-stat">
                <Clock size={16} />
                <div>
                  <strong>
                    {existingSyllabus.units?.reduce((sum, u) => sum + (u.estimatedHours || 0), 0)}h
                  </strong>
                  <span>Est. Study Time</span>
                </div>
              </div>

              <button
                className="btn primary small-btn syl-convert-all-btn"
                onClick={handleConvertAll}
                disabled={busy || convertingUnit === 'all'}
                title="Automatically create tasks for all units in StudyPlanner"
              >
                <Sparkles size={14} />
                <span>
                  {convertingUnit === 'all' ? 'Creating Tasks…' : 'Schedule All Units as Tasks'}
                </span>
              </button>
            </div>

            {/* Units Accordion / Card List */}
            <div className="syllabus-units-list">
              {existingSyllabus.units?.map((unit) => (
                <div key={unit._id || unit.unitNumber} className="unit-card">
                  <div className="unit-card-header">
                    <div className="unit-card-title-group">
                      <span className="unit-badge">Unit {unit.unitNumber}</span>
                      <h4>{unit.title}</h4>
                    </div>

                    <div className="unit-card-tags">
                      <span className="unit-hours-tag">
                        <Clock size={12} /> ~{unit.estimatedHours} hrs
                      </span>
                      <span className={`unit-difficulty-pill ${unit.difficulty?.toLowerCase()}`}>
                        {unit.difficulty}
                      </span>
                      <button
                        className="btn secondary small-btn"
                        onClick={() => handleConvertUnit(unit.unitNumber)}
                        disabled={busy || convertingUnit === unit.unitNumber}
                        title="Create study task for this unit"
                      >
                        <Plus size={13} />
                        <span>
                          {convertingUnit === unit.unitNumber ? 'Scheduling…' : '+ Study Task'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Unit summary text */}
                  {unit.summary && <p className="unit-summary-text">{unit.summary}</p>}

                  {/* Key Terms */}
                  {unit.keyTerms?.length > 0 && (
                    <div className="unit-keyterms-row">
                      <span className="keyterms-label">Key Terms:</span>
                      {unit.keyTerms.map((term, i) => (
                        <span key={i} className="keyterm-chip">
                          {term}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Topics List with Interactive Checkboxes */}
                  <div className="unit-topics-box">
                    <span className="topics-heading">
                      Topics ({unit.topics?.length || 0}):
                    </span>
                    <div className="topics-checklist">
                      {unit.topics?.map((topic, i) => {
                        const topicKey = `${unit.unitNumber}-${i}`;
                        const isDone = checkedTopics.has(topicKey);
                        return (
                          <div
                            key={i}
                            className={`topic-check-item ${isDone ? 'done' : ''}`}
                            onClick={() => toggleTopicCheck(topicKey)}
                          >
                            <div className={`topic-checkbox ${isDone ? 'checked' : ''}`}>
                              {isDone && <Check size={12} />}
                            </div>
                            <span className="topic-text">{topic}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer action buttons */}
            <div className="syllabus-view-footer">
              <button
                className="btn secondary small-btn danger-text"
                onClick={() => {
                  if (confirm('Delete this syllabus document?')) {
                    onDeleteSyllabus(existingSyllabus._id);
                    onClose();
                  }
                }}
              >
                <Trash2 size={14} /> Delete Syllabus
              </button>

              <button className="btn secondary small-btn" onClick={() => setActiveTab('upload')}>
                Update Syllabus Text
              </button>
            </div>
          </div>
        )}

        {/* UPLOAD / EDIT SYLLABUS FORM */}
        {activeTab === 'upload' && (
          <form className="form-stack syllabus-upload-form" onSubmit={handleSave}>
            <div className="form-row">
              <label>
                Subject
                <select
                  required
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                >
                  <option value="">Select Course</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Syllabus Document Title
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures Syllabus 2026"
                />
              </label>
            </div>

            {/* Quick Sample Buttons */}
            <div className="sample-presets-bar">
              <span className="sample-label">
                <Sparkles size={13} /> Or test with sample syllabus:
              </span>
              <button
                type="button"
                className="sample-btn"
                onClick={() => loadSample(SAMPLE_DSA_SYLLABUS, 'Data Structures & Algorithms Syllabus')}
              >
                Load DSA Syllabus
              </button>
              <button
                type="button"
                className="sample-btn"
                onClick={() => loadSample(SAMPLE_DBMS_SYLLABUS, 'Database Management Systems Syllabus')}
              >
                Load DBMS Syllabus
              </button>
            </div>

            {/* Drag & Drop Multi-Format File Area */}
            <div
              className={`file-dropzone ${isDragging ? 'dragging' : ''} ${extracting ? 'loading' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer?.files?.[0];
                if (file) processFile(file);
              }}
            >
              <input
                type="file"
                id="syllabus-file-input"
                accept=".pdf,.txt,.md,.markdown,.docx,.doc,.json,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />

              {extracting ? (
                <div className="dropzone-extracting">
                  <Loader2 className="spinner" size={26} />
                  <strong>Extracting syllabus text…</strong>
                  <span>Reading document structure and units</span>
                </div>
              ) : fileName && docMeta ? (
                <div className="doc-loaded-card">
                  <div className="doc-loaded-icon">
                    <FileCheck size={22} />
                  </div>
                  <div className="doc-loaded-info">
                    <strong>{fileName}</strong>
                    <span>
                      {docMeta.detectedType || 'Document'}
                      {docMeta.pages ? ` · ${docMeta.pages} page${docMeta.pages > 1 ? 's' : ''}` : ''}
                      {docMeta.totalUnits ? ` · ${docMeta.totalUnits} Units detected` : ''}
                      {docMeta.totalTopics ? ` (${docMeta.totalTopics} topics)` : ''}
                    </span>
                  </div>
                  <div className="doc-loaded-actions">
                    <label htmlFor="syllabus-file-input" className="btn secondary small-btn">
                      Change File
                    </label>
                    <button
                      type="button"
                      className="cal-icon-btn danger"
                      title="Clear file"
                      onClick={() => {
                        setRawText('');
                        setFileName('');
                        setDocMeta(null);
                      }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="syllabus-file-input" className="file-drop-label">
                  <Upload size={24} className="drop-icon" />
                  <strong>
                    {isDragging ? 'Drop your syllabus document here' : 'Click to upload syllabus document or drag & drop'}
                  </strong>
                  <span className="file-formats-supported">
                    Supports <b>.pdf</b>, <b>.docx</b>, <b>.txt</b>, <b>.md</b>, <b>.csv</b>
                  </span>
                  <div className="format-badges-row">
                    <span className="fmt-pill">PDF</span>
                    <span className="fmt-pill">Word (.docx)</span>
                    <span className="fmt-pill">Markdown (.md)</span>
                    <span className="fmt-pill">Text (.txt)</span>
                  </div>
                </label>
              )}
            </div>

            {uploadError && (
              <div className="error-msg file-upload-err">
                <AlertCircle size={15} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Textarea for Raw Syllabus Text */}
            <label>
              Or Paste Syllabus Document Text
              <textarea
                required
                rows={10}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Paste your syllabus text here... For example:

UNIT 1: Introduction to Data Structures
Abstract Data Types, Arrays, Linked Lists, Memory Representation

UNIT 2: Stacks and Queues
Stack operations, Infix to Postfix, Queues, Circular Queues`}
              />
            </label>

            <p className="field-hint">
              StudyPilot automatically identifies <strong>Unit / Module</strong> divisions,
              extracts topics, estimates study hours, and summarizes the coursework.
            </p>

            <div className="modal-actions">
              <button type="button" className="btn secondary" onClick={onClose}>
                Cancel
              </button>
              <button className="btn primary" disabled={busy || !rawText.trim() || !selectedSubjectId}>
                <Sparkles size={15} />
                <span>{busy ? 'Analyzing & Summarizing…' : 'Summarize & Store Syllabus'}</span>
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
