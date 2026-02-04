# Pile Master Mobile App - Design Document

## Overview

Pile Master is a mobile app for drilling operation control and safety compliance. It guides operators through a structured workflow for each shift, capturing critical data, photos, and signatures for legal compliance and operational tracking.

## Screen List

1. **Authorization Screen** - Operator login with ID and PIN verification
2. **Rig Selection Screen** - Choose drilling equipment from available inventory
3. **Safety Briefing Screen** - Review and confirm safety requirements with electronic signature
4. **Pre-Shift Inspection Screen** - Checklist-based inspection of equipment with before/after photos
5. **Lubrication Screen** - Record lubrication of equipment nodes with photo documentation
6. **Work Process Screen** - Monitor active shift with telemetry, incident reporting, and emergency controls
7. **Shift Closure Screen** - Final photo documentation and shift report generation
8. **Success Screen** - Confirmation with legal document details and blockchain verification

## Primary Content and Functionality

### Authorization Screen
- Operator ID input field
- PIN code entry (4 digits)
- System lock status indicator
- Offline mode indicator
- Login validation with error messages

### Rig Selection Screen
- List of available rigs with:
  - Rig name and type badge
  - Location with map icon
  - Serial number (if available)
  - Configuration details
  - Selection radio button
- ML recommendations panel (if available)
- Warehouse availability warnings
- Next button validation

### Safety Briefing Screen
- Scrollable list of 5 safety items:
  - PPE requirements
  - Safety zone setup
  - Equipment checks
  - Emergency stop procedures
  - Weather restrictions
- Mark as read buttons for each item
- Safety confirmation checkbox
- Electronic signature canvas:
  - Touch/mouse drawing area
  - Clear and save buttons
- Voice control panel (if supported)

### Pre-Shift Inspection Screen
- 5 inspection items (tracks, hydraulics, cab, boom, engine)
- For each item:
  - Checklist with 3 sub-items
  - Before photo placeholder
  - After photo placeholder
  - Status badge (Pending/Completed)
- Progress tracking
- Next button validation

### Lubrication Screen
- Warehouse stock status for selected rig
- Applicable lubrication points (filtered by rig model)
- For each point:
  - Name and grease requirements
  - Photo placeholder
  - Warehouse availability status
  - Take photo button
- Warehouse warning if insufficient materials
- Next button validation

### Work Process Screen
- Shift timer (HH:MM:SS format)
- Work statistics:
  - Piles drilled count
  - Depth (meters)
- Telemetry data panel:
  - Engine hours
  - Temperature
  - Hydraulic pressure
  - Fuel level (visual bar)
- Incident reporting buttons:
  - Equipment failure
  - Safety violation
- Emergency stop button (animated pulse)
- Shift toggle button (Start/End work)

### Shift Closure Screen
- Final photo placeholder for equipment state
- Shift summary:
  - Operator name
  - Rig name
  - Work duration
  - Piles count
  - Grease used
  - Photos count
  - Event log count
- Legal document preview with verification code
- ML analytics summary (if available)
- Blockchain verification info
- Submit button

### Success Screen
- Success checkmark icon
- Completion message
- Shift summary card
- Legal document details
- ML analytics summary
- Blockchain verification details
- Start new shift button

## Key User Flows

### Main Workflow Flow
1. User enters ID and PIN → Authorization
2. Selects rig from list → Rig Selection
3. Reviews safety items and signs → Safety Briefing
4. Completes inspection checklist with photos → Pre-Shift Inspection
5. Lubricates equipment nodes with photos → Lubrication
6. Monitors work and reports incidents → Work Process
7. Takes final photo and submits → Shift Closure
8. Views completion summary → Success

### Emergency Flow
- User taps Emergency Stop → System locks
- Alert notification displayed
- All operations halted
- Admin intervention required

### Offline Sync Flow
- App detects offline mode
- Events queued locally
- Sync button appears when online
- Events synchronized with verification code

## Color Scheme

- **Primary**: `#0a7ea4` (Blue) - Main actions, progress
- **Background**: `#ffffff` (White) - Screen backgrounds
- **Surface**: `#f5f5f5` (Light Gray) - Cards and elevated surfaces
- **Foreground**: `#11181C` (Dark Gray) - Primary text
- **Muted**: `#687076` (Medium Gray) - Secondary text
- **Border**: `#E5E7EB` (Light Border) - Dividers
- **Success**: `#22C55E` (Green) - Completed states
- **Warning**: `#F59E0B` (Amber) - Warnings and cautions
- **Error**: `#EF4444` (Red) - Errors and critical alerts

## Design Principles

- **Mobile-First**: Optimized for portrait orientation (9:16)
- **One-Handed**: Touch targets sized for thumb reach
- **Safety-Focused**: Clear warnings and confirmations for critical actions
- **Accessibility**: High contrast, readable fonts, clear labels
- **Legal Compliance**: Event logging, signatures, blockchain verification
- **Offline-Ready**: Local data storage with sync capability
