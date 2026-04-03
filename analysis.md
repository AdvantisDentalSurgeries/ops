# Dental Surgery Operations System — Analysis & Design

---

## Part 1: Functional Requirements

### Dentist Registration

- **FR1:** The system shall allow the Office Manager to register a new Dentist with a system-generated unique ID, first name, last name, contact phone number, email, and specialization.

### Patient Enrollment

- **FR2:** The system shall allow the Office Manager to enroll a new Patient with first name, last name, contact phone number, email, mailing address, and date of birth.

### Appointment Requests

- **FR3:** The system shall allow a Patient to request an appointment by calling in, with the Office Manager recording the request on their behalf.
- **FR4:** The system shall allow a Patient to request an appointment by submitting an online form on the ADS website.

### Appointment Booking

- **FR5:** The system shall allow the Office Manager to book an appointment upon receiving an appointment request.
- **FR6:** The system shall automatically send a confirmation email to the Patient when their appointment is booked.
- **FR7:** The system shall record each appointment with its date, time, assigned dentist, patient, and surgery location.

### Dentist Portal

- **FR8:** The system shall allow a Dentist to sign in to the system.
- **FR9:** The system shall allow a Dentist to view a list of all their scheduled appointments, including the details of each Patient they are scheduled to see.

### Patient Portal

- **FR10:** The system shall allow a Patient to sign in to the system.
- **FR11:** The system shall allow a Patient to view their appointments, including information about the assigned dentist.
- **FR12:** The system shall allow a Patient to request cancellation of an existing appointment.
- **FR13:** The system shall allow a Patient to request rescheduling of an existing appointment.

### Surgery Information

- **FR14:** The system shall store and display information about each Surgery, including its name, location address, and telephone number.

### Business Rules / Constraints

- **FR15:** The system shall prevent a Dentist from being assigned more than 5 appointments in any given calendar week.
- **FR16:** The system shall prevent a Patient from requesting a new appointment if they have an outstanding unpaid bill for a previously received dental service.

---

## Part 2: Domain Model UML Class Diagram

### Classes & Attributes

```
Dentist
  - dentistId : String   <<unique>>
  - firstName : String
  - lastName : String
  - phone : String
  - email : String
  - specialization : String

Patient
  - patientId : String   <<unique>>
  - firstName : String
  - lastName : String
  - phone : String
  - email : String
  - mailingAddress : String
  - dateOfBirth : Date

Appointment
  - appointmentId : String
  - dateTime : DateTime
  - status : AppointmentStatus  {SCHEDULED, CANCELLED, COMPLETED}

AppointmentRequest
  - requestId : String
  - requestType : RequestType  {PHONE, ONLINE}
  - requestDate : DateTime

Surgery
  - surgeryId : String
  - name : String
  - locationAddress : String
  - telephoneNumber : String

Bill
  - billId : String
  - amount : Decimal
  - isPaid : Boolean
  - dueDate : Date
```

### Relationships

| From               | Role / Label   | To                 | Multiplicity                |
| ------------------ | -------------- | ------------------ | --------------------------- |
| Patient            | submits        | AppointmentRequest | 1 to 0..\*                  |
| AppointmentRequest | results in     | Appointment        | 0..1 to 0..1                |
| Patient            | attends        | Appointment        | 1 to 0..\*                  |
| Dentist            | conducts       | Appointment        | 1 to 0..\* (max 5 per week) |
| Appointment        | takes place at | Surgery            | 0..\* to 1                  |
| Patient            | owes           | Bill               | 1 to 0..\*                  |
| Appointment        | generates      | Bill               | 1 to 0..1                   |

See [uml.md](uml.md) for the PlantUML source.
