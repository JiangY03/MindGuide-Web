import React, { useState, useEffect, useRef } from 'react';
import { getReport } from '../api/report';
import './Report.css';

const Report = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const reportData = await getReport();
      if (reportData) {
        setReport(reportData);
      } else {
        setError('Failed to generate report');
      }
    } catch (err) {
      setError('Error loading report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadPDF = () => {
    if (!reportRef.current) return;
    
    // Import html2pdf dynamically
    import('html2pdf.js').then((html2pdf) => {
      const element = reportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Mental_Health_Report_${formatDate(report.generated_at).replace(/ /g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      html2pdf.default().set(opt).from(element).save();
    }).catch(err => {
      console.error('Error downloading PDF:', err);
      alert('PDF download failed. Please try again.');
    });
  };

  const getWellbeingColor = (score) => {
    if (score >= 8) return '#4CAF50';
    if (score >= 6) return '#FF9800';
    return '#F44336';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div className="report-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Generating your personal report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="report-container">
        <div className="error">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={loadReport} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="report-container">
        <div className="no-data">
          <h2>📊 No Data Available</h2>
          <p>Start tracking your mood and completing assessments to generate a report.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-container">
      <div className="report-actions">
        <button onClick={loadReport} className="refresh-btn">
          🔄 Refresh Report
        </button>
        <button onClick={downloadPDF} className="download-btn">
          📥 Download PDF
        </button>
      </div>
      
      <div className="report-content" ref={reportRef}>
        <div className="report-header">
          <div className="header-content">
            <h1>Personal Mental Health Report</h1>
            <p className="report-subtitle">Comprehensive Mental Health Assessment</p>
            <p className="report-date">
              Generated on {formatDate(report.generated_at)}
            </p>
            <div className="report-period">
              <span>Report Period: {formatDate(report.period?.start)} - {formatDate(report.period?.end)}</span>
            </div>
          </div>
        </div>

      {/* Overall Wellbeing Score */}
      <div className="report-section">
        <h2 className="section-title">Overall Wellbeing</h2>
        <div className="wellbeing-score">
          <div 
            className="score-circle"
            style={{ 
              backgroundColor: getWellbeingColor(report.summary.overall_wellbeing),
              color: 'white'
            }}
          >
            <div className="score-number">{report.summary.overall_wellbeing || 0}</div>
            <div className="score-label">/10</div>
          </div>
          <div className="score-details">
            <p className="score-description">Your overall wellbeing score is calculated based on your mood tracking, assessment results, and engagement with support resources.</p>
            <div className="wellbeing-status">
              {report.summary.overall_wellbeing >= 8 ? 'Excellent' : 
               report.summary.overall_wellbeing >= 6 ? 'Good' : 
               report.summary.overall_wellbeing >= 4 ? 'Fair' : 'Needs Attention'}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="report-section">
        <h2 className="section-title">Summary Statistics</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <h3>{report.summary.total_days_tracked || 0}</h3>
            <p>Days Tracked</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">😊</div>
            <h3>{report.summary.recent_mood_average?.toFixed(1) || '0.0'}</h3>
            <p>Average Mood (1-5)</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <h3>{report.summary.assessment_count || 0}</h3>
            <p>Assessments Completed</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💬</div>
            <h3>{report.summary.chat_sessions || 0}</h3>
            <p>Chat Sessions</p>
          </div>
          {report.summary.cognitive_records !== undefined && (
            <div className="stat-card">
              <div className="stat-icon">🧠</div>
              <h3>{report.summary.cognitive_records || 0}</h3>
              <p>Cognitive Exercises</p>
            </div>
          )}
        </div>
      </div>

      {/* Mood Analysis */}
      <div className="report-section">
        <h2 className="section-title">Mood Analysis</h2>
        <div className="mood-analysis">
          <div className="mood-item">
            <span className="label">Average Score:</span>
            <span className="value">{report.mood_analysis.average_score?.toFixed(1) || '0.0'}/5.0</span>
          </div>
          <div className="mood-item">
            <span className="label">Trend:</span>
            <span className="value">
              {getTrendIcon(report.mood_analysis.trend)} {report.mood_analysis.trend?.replace('_', ' ') || 'insufficient data'}
            </span>
          </div>
          <div className="mood-item">
            <span className="label">Consistency:</span>
            <span className="value">{report.mood_analysis.consistency?.replace('_', ' ') || 'insufficient data'}</span>
          </div>
          {report.mood_analysis.best_day && (
            <div className="mood-item">
              <span className="label">Best Day:</span>
              <span className="value">{formatDate(report.mood_analysis.best_day)}</span>
            </div>
          )}
          {report.mood_analysis.challenging_day && (
            <div className="mood-item">
              <span className="label">Challenging Day:</span>
              <span className="value">{formatDate(report.mood_analysis.challenging_day)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Assessment Analysis */}
      {report.assessment_analysis.latest_score !== null && report.assessment_analysis.latest_score !== undefined ? (
        <div className="report-section">
          <h2 className="section-title">Assessment Analysis</h2>
          <div className="assessment-analysis">
            <div className="assessment-item">
              <span className="label">Latest PHQ-9 Score:</span>
              <span className="value">{report.assessment_analysis.latest_score}/27</span>
            </div>
            <div className="assessment-item">
              <span className="label">Severity Level:</span>
              <span className="value">{report.assessment_analysis.latest_level?.replace('_', ' ') || 'N/A'}</span>
            </div>
            {report.assessment_analysis.crisis_detected && (
              <div className="crisis-alert">
                <strong>⚠️ Crisis Alert:</strong> Crisis indicators detected in recent assessment. Please seek immediate professional support.
              </div>
            )}
            {report.assessment_analysis.improvement && report.assessment_analysis.improvement !== 'insufficient_data' && (
              <div className="assessment-item">
                <span className="label">Improvement Trend:</span>
                <span className="value">
                  {getTrendIcon(report.assessment_analysis.improvement)} {report.assessment_analysis.improvement}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="report-section">
          <h2 className="section-title">Assessment Analysis</h2>
          <p className="no-data-message">No assessment data available. Complete an assessment to see your analysis here.</p>
        </div>
      )}

      {/* Chat Analysis */}
      <div className="report-section">
        <h2 className="section-title">Chat Engagement</h2>
        <div className="chat-analysis">
          <div className="chat-item">
            <span className="label">Total Sessions:</span>
            <span className="value">{report.chat_analysis.total_sessions || 0}</span>
          </div>
          <div className="chat-item">
            <span className="label">Recent Sessions (7 days):</span>
            <span className="value">{report.chat_analysis.recent_sessions || 0}</span>
          </div>
          <div className="chat-item">
            <span className="label">Engagement Level:</span>
            <span className="value">{report.chat_analysis.engagement_level || 'low'}</span>
          </div>
          {report.chat_analysis.top_concerns && report.chat_analysis.top_concerns.length > 0 && (
            <div className="concerns">
              <h4>Top Concerns Discussed:</h4>
              <ul>
                {report.chat_analysis.top_concerns.map((concern, index) => (
                  <li key={index}>
                    <strong>{concern[0]?.charAt(0).toUpperCase() + concern[0]?.slice(1) || 'N/A'}</strong> 
                    {' '}(mentioned {concern[1] || 0} {concern[1] === 1 ? 'time' : 'times'})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Cognitive Analysis */}
      {report.cognitive_analysis && (
        <div className="report-section">
          <h2 className="section-title">Cognitive Restructuring Analysis</h2>
          <div className="cognitive-analysis">
            <div className="cognitive-item">
              <span className="label">Total Records:</span>
              <span className="value">{report.cognitive_analysis.total_records || 0}</span>
            </div>
            <div className="cognitive-item">
              <span className="label">Recent Records (7 days):</span>
              <span className="value">{report.cognitive_analysis.recent_records || 0}</span>
            </div>
            {report.cognitive_analysis.average_improvement !== null && report.cognitive_analysis.average_improvement !== undefined && (
              <div className="cognitive-item">
                <span className="label">Average Improvement:</span>
                <span className="value">
                  {report.cognitive_analysis.average_improvement > 0 ? '+' : ''}
                  {report.cognitive_analysis.average_improvement.toFixed(1)} points
                </span>
              </div>
            )}
            {report.cognitive_analysis.common_situations && report.cognitive_analysis.common_situations.length > 0 && (
              <div className="situations">
                <h4>Common Situations:</h4>
                <ul>
                  {report.cognitive_analysis.common_situations.map((situation, index) => (
                    <li key={index}>
                      <strong>{situation[0]?.charAt(0).toUpperCase() + situation[0]?.slice(1) || 'N/A'}</strong> 
                      {' '}({situation[1] || 0} {situation[1] === 1 ? 'time' : 'times'})
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(!report.cognitive_analysis.total_records || report.cognitive_analysis.total_records === 0) && (
              <p className="no-data-message">No cognitive restructuring records available. Use the cognitive restructuring tool in Self-help Tools to start tracking your thought patterns.</p>
            )}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {report.ai_insights && report.ai_insights.summary && (
        <div className="report-section">
          <h2 className="section-title">AI Insights</h2>
          <div className="ai-insights">
            <p>{report.ai_insights.summary}</p>
            {report.ai_insights.generated_at && (
              <small className="insights-timestamp">Generated: {formatDate(report.ai_insights.generated_at)}</small>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="report-section">
        <h2 className="section-title">Recommendations</h2>
        <div className="recommendations">
          {report.recommendations && report.recommendations.length > 0 ? (
            report.recommendations.map((rec, index) => {
              // Handle both old string format and new object format
              const title = typeof rec === 'string' ? rec : rec.title || 'Recommendation';
              const description = typeof rec === 'string' ? '' : rec.description || '';
              const priority = typeof rec === 'string' ? 'medium' : rec.priority || 'medium';
              
              return (
                <div key={index} className="recommendation-card">
                  <div className="rec-header">
                    <h4>{title}</h4>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(priority) }}
                    >
                      {priority}
                    </span>
                  </div>
                  {description && <p>{description}</p>}
                </div>
              );
            })
          ) : (
            <p className="no-data-message">No specific recommendations at this time.</p>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="report-section">
        <h2 className="section-title">Next Steps</h2>
        <div className="next-steps">
          {report.next_steps && report.next_steps.length > 0 ? (
            report.next_steps.map((step, index) => {
              // Handle both old string format and new object format
              const title = typeof step === 'string' ? step : step.title || 'Next Step';
              const description = typeof step === 'string' ? '' : step.description || '';
              const urgency = typeof step === 'string' ? 'medium' : step.urgency || 'medium';
              
              return (
                <div key={index} className="step-card">
                  <div className="step-header">
                    <h4>{title}</h4>
                    <span 
                      className="urgency-badge"
                      style={{ backgroundColor: getPriorityColor(urgency) }}
                    >
                      {urgency}
                    </span>
                  </div>
                  {description && <p>{description}</p>}
                </div>
              );
            })
          ) : (
            <p className="no-data-message">No specific next steps at this time.</p>
          )}
        </div>
      </div>

      <div className="report-footer">
        <p className="disclaimer">
          <strong>Disclaimer:</strong> This report is for informational purposes only and should not replace professional medical advice. If you are experiencing a mental health emergency, please contact your local emergency services or a crisis hotline immediately.
        </p>
        <p className="report-id">
          Report ID: {report.generated_at ? new Date(report.generated_at).getTime() : 'N/A'}
        </p>
      </div>
      </div>
    </div>
  );
};

export default Report;
