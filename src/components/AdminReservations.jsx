import React, { useState } from 'react';
import { ArrowLeft, PencilLine, Save, X, Trash2 } from 'lucide-react';

const diningZones = [
  'Indoor Main Dining Room',
  'Outdoor Garden Terrace',
  'Rooftop Lounge',
  'Private VIP Room',
  "Chef's Counter Table"
];

const AdminReservations = ({ reservations = [], onBack, onUpdateReservation, onDeleteReservation }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const startEdit = (reservation) => {
    setEditingId(reservation.id);
    setEditForm({ ...reservation });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveEdit = () => {
    if (!editForm.id) return;
    onUpdateReservation?.(editForm.id, editForm);
    setEditingId(null);
    setEditForm({});
  };

  const confirmDelete = (reservationId) => {
    setDeleteConfirmId(reservationId);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleDelete = (reservationId) => {
    onDeleteReservation?.(reservationId);
    setDeleteConfirmId(null);
  };

  return (
    <div className="admin-panel admin-reservations-panel">
      <div className="admin-panel-header">
        <div>
          <p className="section-label">Admin Reservations</p>
          <h1 className="section-title">Reservation Details</h1>
        </div>
        <button className="admin-action-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      <div className="admin-activity-panel">
        <div className="admin-section-heading">Previous Successful Reservations</div>
        {reservations.length === 0 ? (
          <div className="empty-reservation-state">No successful reservations yet.</div>
        ) : (
          <div className="reservations-list">
            {reservations.map((reservation) => {
              const isEditing = editingId === reservation.id;

              return (
                <div key={reservation.id} className="reservation-card">
                  <div className="reservation-card-main">
                    <div className="reservation-card-header">
                      <span className="reservation-id">{reservation.id}</span>
                      <div className="reservation-card-actions">
                        {isEditing ? (
                          <>
                            <button className="reservation-action-btn save" onClick={handleSaveEdit}>
                              <Save size={14} /> Save
                            </button>
                            <button className="reservation-action-btn cancel" onClick={cancelEdit}>
                              <X size={14} /> Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button className="reservation-action-btn" onClick={() => startEdit(reservation)}>
                              <PencilLine size={14} /> Edit
                            </button>
                            <button className="reservation-action-btn delete" onClick={() => confirmDelete(reservation.id)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </>
                        )}
                        <span className="reservation-badge">Confirmed</span>
                      </div>
                    </div>

                    {deleteConfirmId === reservation.id && (
                      <div className="reservation-delete-confirm">
                        <span>Delete this reservation?</span>
                        <div className="reservation-delete-actions">
                          <button className="reservation-action-btn" onClick={cancelDelete}>Cancel</button>
                          <button className="reservation-action-btn delete" onClick={() => handleDelete(reservation.id)}>Delete</button>
                        </div>
                      </div>
                    )}

                    {isEditing ? (
                      <div className="reservation-edit-form">
                        <div className="reservation-edit-grid">
                          <label className="reservation-edit-field">
                            <span>Guest</span>
                            <input
                              type="text"
                              value={editForm.name || ''}
                              onChange={(e) => handleEditChange('name', e.target.value)}
                            />
                          </label>
                          <label className="reservation-edit-field">
                            <span>Date</span>
                            <input
                              type="date"
                              value={editForm.date || ''}
                              onChange={(e) => handleEditChange('date', e.target.value)}
                            />
                          </label>
                          <label className="reservation-edit-field">
                            <span>Time</span>
                            <input
                              type="time"
                              value={editForm.time || ''}
                              onChange={(e) => handleEditChange('time', e.target.value)}
                            />
                          </label>
                          <label className="reservation-edit-field">
                            <span>Guests</span>
                            <select
                              value={editForm.guests || '2'}
                              onChange={(e) => handleEditChange('guests', e.target.value)}
                            >
                              <option value="1">1 Person</option>
                              <option value="2">2 Guests</option>
                              <option value="3">3 Guests</option>
                              <option value="4">4 Guests</option>
                              <option value="5">5 Guests</option>
                              <option value="6">6+ Guests</option>
                            </select>
                          </label>
                          <label className="reservation-edit-field full-width">
                            <span>Zone</span>
                            <select
                              value={editForm.zone || diningZones[0]}
                              onChange={(e) => handleEditChange('zone', e.target.value)}
                            >
                              {diningZones.map((zone) => (
                                <option key={zone} value={zone}>{zone}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div className="reservation-details-grid">
                        <div>
                          <div className="reservation-label">Guest</div>
                          <div className="reservation-value">{reservation.name}</div>
                        </div>
                        <div>
                          <div className="reservation-label">Date & Time</div>
                          <div className="reservation-value">{reservation.date} · {reservation.time}</div>
                        </div>
                        <div>
                          <div className="reservation-label">Guests</div>
                          <div className="reservation-value">{reservation.guests}</div>
                        </div>
                        <div>
                          <div className="reservation-label">Zone</div>
                          <div className="reservation-value">{reservation.zone}</div>
                        </div>
                      </div>
                    )}
                  </div>
                  {reservation.qrCodeDataUrl && (
                    <div className="reservation-qr-box">
                      <img src={reservation.qrCodeDataUrl} alt="Reservation QR code" className="reservation-qr-image" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReservations;
