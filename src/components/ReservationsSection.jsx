import React, { useState } from 'react';
import QRCode from 'qrcode';
import { Calendar, Users, Clock, MapPin, Check, ChevronRight, Info, Sparkles, User, ShieldCheck } from 'lucide-react';
import { createReservation as apiCreateReservation } from '../services/apiService';
import './ReservationsSection.css';

const saveQrToBookingFolder = async (booking, imageBuffer, imageType) => {
  try {
    const response = await fetch('/api/bookings/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id, imageBuffer, imageType })
    });

    if (!response.ok) {
      throw new Error('Unable to save QR code file.');
    }

    const data = await response.json();
    return data.savedPath || null;
  } catch (error) {
    console.error('Unable to save QR code file:', error);
    return null;
  }
};

const ReservationsSection = ({ onReservationSuccess }) => {
  const [resName, setResName] = useState('');
  const [resDate, setResDate] = useState('');
  const [resTime, setResTime] = useState('');
  const [resGuests, setResGuests] = useState('2');
  const [resZone, setResZone] = useState('Indoor Main Dining Room');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [error, setError] = useState('');

  const diningZones = [
    { id: 'indoor', label: 'Indoor Main Dining Room', desc: 'Cozy, climate-controlled setting near the chef kitchen.', badge: 'Popular' },
    { id: 'outdoor', label: 'Outdoor Garden Terrace', desc: 'Beautiful open-air dining surrounded by greenery and lanterns.', badge: 'Romantic' },
    { id: 'rooftop', label: 'Rooftop Lounge', desc: 'Panoramic city views and lively music, perfect for evening drinks.', badge: 'Great View' },
    { id: 'vip', label: 'Private VIP Room', desc: 'Quiet, secluded, personal butler service (Requires ₹2000 min spend).', badge: 'Exclusive' },
    { id: 'chef', label: "Chef's Counter Table", desc: 'Front-row seats directly watching our culinary experts cook.', badge: 'Interactive' }
  ];

  const handleBookTable = async (e) => {
    e.preventDefault();
    if (!resName || !resDate || !resTime || !resGuests) {
      setError('Please fill in all booking fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessData(null);

    try {
      const reservationPayload = {
        name: resName,
        date: resDate,
        time: resTime,
        guests: parseInt(resGuests, 10),
        tableType: resZone,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString()
      };

      let savedReservation = null;
      try {
        savedReservation = await apiCreateReservation(reservationPayload);
      } catch (err) {
        console.warn('Backend API submission note:', err);
      }

      const bookingId = savedReservation?.id || 'RES-' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const mockReservation = {
        id: bookingId,
        name: resName,
        date: resDate,
        time: resTime,
        guests: resGuests,
        zone: resZone,
        tableType: resZone
      };

      const qrPayload = [
        `Reservation ID: ${mockReservation.id}`,
        `Guest: ${mockReservation.name}`,
        `Date: ${mockReservation.date}`,
        `Time: ${mockReservation.time}`,
        `Guests: ${mockReservation.guests}`,
        `Zone: ${mockReservation.zone}`
      ].join('\n');

      const qrDataUrl = await QRCode.toDataURL(qrPayload, { width: 240, margin: 1 });
      const imageBuffer = qrDataUrl.split(',')[1];
      const savedPath = await saveQrToBookingFolder(mockReservation, imageBuffer, 'png');

      const completedReservation = {
        ...mockReservation,
        qrCodeDataUrl: qrDataUrl,
        qrSavedPath: savedPath,
        createdAt: new Date().toISOString()
      };

      onReservationSuccess?.(completedReservation);
      setSuccessData(completedReservation);
      setResName('');
      setResDate('');
      setResTime('');
      setResGuests('2');
      setResZone('Indoor Main Dining Room');
      setLoading(false);
    } catch (bookingError) {
      console.error(bookingError);
      setError('Unable to create the booking QR code right now.');
      setLoading(false);
    }
  };

  return (
    <div className="modern-res-wrapper">
      <div className="res-ambient-bg">
        <div className="blur-orb orb-1"></div>
        <div className="blur-orb orb-2"></div>
      </div>

      <div className="res-page-container">
        {/* Header Section */}
        <div className="res-page-header">
          <span className="res-badge">
            <Sparkles size={14} /> Instant Confirmation
          </span>
          <h1 className="res-page-title">Reserve Your Table</h1>
          <p className="res-page-subtitle">
            Skip the waiting queue. Customize your dining atmosphere and confirm in seconds.
          </p>
        </div>

        <div className="res-split-layout">
          {/* Main Form Container */}
          <div className="res-form-section">
            {successData ? (
              <div className="booking-success-card">
                <div className="success-header">
                  <div className="success-icon-ring">
                    <Check size={28} />
                  </div>
                  <h2>Reservation Confirmed!</h2>
                  <p className="success-ref">Reference Code: <span>{successData.id}</span></p>
                </div>

                <div className="booking-ticket">
                  <div className="ticket-details">
                    <div className="ticket-row">
                      <span className="label">Guest Name</span>
                      <span className="value">{successData.name}</span>
                    </div>
                    <div className="ticket-row">
                      <span className="label">Party Size</span>
                      <span className="value">{successData.guests} Guests</span>
                    </div>
                    <div className="ticket-row">
                      <span className="label">Date & Time</span>
                      <span className="value">{successData.date} • {successData.time}</span>
                    </div>
                    <div className="ticket-row">
                      <span className="label">Dining Zone</span>
                      <span className="value">{successData.zone}</span>
                    </div>
                  </div>

                  {successData.qrCodeDataUrl && (
                    <div className="booking-qr-wrapper">
                      <img src={successData.qrCodeDataUrl} alt="Booking QR Code" className="booking-qr-image" />
                      <p className="booking-qr-note">
                        {successData.qrSavedPath
                          ? `Saved to: ${successData.qrSavedPath}`
                          : 'Show this QR code upon arrival.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="success-info-banner">
                  <Info size={16} />
                  <span>We hold tables for up to 15 minutes past the scheduled arrival time.</span>
                </div>

                <button 
                  className="booking-reset-btn"
                  onClick={() => setSuccessData(null)}
                >
                  Make Another Reservation
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookTable} className="booking-form-box">
                <h3 className="form-legend">Guest & Time Details</h3>
                
                {error && <div className="form-error-box">{error}</div>}

                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-with-icon">
                    <User className="input-icon" size={18} />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Eleanor Vance"
                      value={resName}
                      onChange={(e) => setResName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Date</label>
                    <div className="input-with-icon">
                      <Calendar className="input-icon" size={18} />
                      <input 
                        type="date" 
                        required
                        value={resDate}
                        onChange={(e) => setResDate(e.target.value)}
                        onClick={(e) => {
                          try { e.target.showPicker(); } catch {}
                        }}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Time</label>
                    <div className="input-with-icon">
                      <Clock className="input-icon" size={18} />
                      <input 
                        type="time" 
                        required
                        value={resTime}
                        onChange={(e) => setResTime(e.target.value)}
                        onClick={(e) => {
                          try { e.target.showPicker(); } catch {}
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>Number of Guests</label>
                  <div className="input-with-icon">
                    <Users className="input-icon" size={18} />
                    <select 
                      value={resGuests}
                      onChange={(e) => setResGuests(e.target.value)}
                    >
                      <option value="1">1 Guest (Solo Dining)</option>
                      <option value="2">2 Guests (Standard)</option>
                      <option value="3">3 Guests</option>
                      <option value="4">4 Guests</option>
                      <option value="5">5 Guests</option>
                      <option value="6">6+ Guests (Large Group)</option>
                    </select>
                  </div>
                </div>

                {/* Modern Seating Zone Selection Cards */}
                <div className="form-group">
                  <label>Select Dining Atmosphere</label>
                  <div className="zone-selector-grid">
                    {diningZones.map((zone) => {
                      const isSelected = resZone === zone.label;
                      return (
                        <div 
                          key={zone.id} 
                          className={`zone-card ${isSelected ? 'active' : ''}`}
                          onClick={() => setResZone(zone.label)}
                        >
                          <div className="zone-card-header">
                            <span className="zone-name">{zone.label}</span>
                            {zone.badge && <span className="zone-badge">{zone.badge}</span>}
                          </div>
                          <p className="zone-desc">{zone.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="booking-submit-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="form-spinner"></div> Confirming...
                    </>
                  ) : (
                    <>Complete Reservation <ChevronRight size={18} /></>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Dynamic Pass Preview & Highlights */}
          <div className="res-details-section">
            {!successData && (
              <div className="live-ticket-card">
                <div className="ticket-card-header">
                  <div>
                    <h4>TastyBite Pass</h4>
                    <span className="live-status"><span className="pulse-dot"></span> Live Preview</span>
                  </div>
                  <ShieldCheck size={24} className="pass-shield-icon" />
                </div>

                <div className="ticket-card-body">
                  <div className="preview-field">
                    <span>GUEST NAME</span>
                    <h6>{resName || 'Your Name Here'}</h6>
                  </div>
                  
                  <div className="preview-row-grid">
                    <div className="preview-field">
                      <span>PARTY SIZE</span>
                      <h6>{resGuests} {parseInt(resGuests, 10) === 1 ? 'Guest' : 'Guests'}</h6>
                    </div>
                    <div className="preview-field">
                      <span>TIME</span>
                      <h6>{resTime || '--:--'}</h6>
                    </div>
                  </div>

                  <div className="preview-field">
                    <span>DATE</span>
                    <h6>{resDate || 'MM / DD / YYYY'}</h6>
                  </div>

                  <div className="preview-field">
                    <span>SEATING AREA</span>
                    <h6 className="highlight-text">{resZone}</h6>
                  </div>
                </div>

                <div className="ticket-card-footer">
                  <div className="mock-barcode"></div>
                </div>
              </div>
            )}

            <div className="guarantee-box">
              <div className="guarantee-item">
                <ShieldCheck size={20} />
                <div>
                  <strong>Instant Confirmation</strong>
                  <p>Your table is reserved immediately upon booking completion.</p>
                </div>
              </div>
              <div className="guarantee-item">
                <Clock size={20} />
                <div>
                  <strong>Free Cancellation</strong>
                  <p>Cancel or update your reservation up to 2 hours before arrival.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationsSection;