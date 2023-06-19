public with sharing class ResultOfDoctorExaminationCtrl {
    public Boolean displayObjectiveStatus {
        get {
            return objectiveStatus != null && objectiveStatus.Is_active__c;
        }
        set;
    }
    public Boolean displayEyeground {
        get {
            return eyegroundInvestigation != null && eyegroundInvestigation.Is_active__c;
        }
        set;
    }

    public Boolean showCorrectionLeft {
        get {
            return objectiveStatus != null && objectiveStatus.Show_visus_correction_left__c;
        }
        set;
    }

    public Boolean showCorrectionRight {
        get  {
            return objectiveStatus != null && objectiveStatus.Show_visus_correction_right__c;
        }
        set;
    }

    public String pageHeader {
        get  {
            return doctorAppointment != null ? doctorAppointment.Appointment_place__r.Name + ' микрохирургии глаза Макарчука' : 'Центр микрохирургии глаза Макарчука';
        }
        set;
    }

    public String noCorrection {
        get  {
            return 'нк';
        }
        set;
    }

    public String notOphthalmoscopically { get {return 'Не офтальмоскопируется';} set;}

    private final Contact patient;
    private final Contact doctor;
    private final Objective_status__c objectiveStatus;
    private final Doctor_Appointment__c doctorAppointment;
    public final Eyeground_Investigation__c eyegroundInvestigation {public get; private set;}

    public ResultOfDoctorExaminationCtrl(ApexPages.StandardController controller) {
        controller.addFields(new List<String> {
                'Id',
                'Anamnesis__c',
                'Appointment_Date__c',
                'Complaints__c',
                'Diagnosis__c',
                'Doctor__c',
                'Objective_status__c',
                'Patient__c',
                'Recommendations__c',
                'Eyeground_Investigation__c',
                'Appointment_place__r.Name'
        });
        this.doctorAppointment = (Doctor_Appointment__c)controller.getRecord();
        this.objectiveStatus = getObjectiveStatus(this.doctorAppointment.Objective_status__c);
        this.eyegroundInvestigation = getEyegroundInvestigation(this.doctorAppointment.Eyeground_Investigation__c);
        for (Contact con: getContacts(new List<String> {this.doctorAppointment.Doctor__c, this.doctorAppointment.Patient__c})) {
            if (con.RecordType.DeveloperName == 'Doctor') {
                this.doctor = con;
            } else if (con.RecordType.DeveloperName == 'Patient') {
                this.patient = con;
            }
        }
    }

    public Objective_status__c getObjectiveStatus() {
        return this.objectiveStatus;
    }
    public String getDiagnosis() {
        return convertArrayDataToDisplayString(this.doctorAppointment.Diagnosis__c);
    }
    public List<String> getRecommendations() {
        List<String> result = new List<String>();
        if(String.isNotEmpty(this.doctorAppointment.Recommendations__c)) {
            result =  (List<String>) JSON.deserialize(this.doctorAppointment.Recommendations__c, List<String>.class);
        }
        return result;
    }
    public String getEyePositionLeft() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Eye_Position_Left__c);
    }
    public String getEyePositionRight() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Eye_Position_Right__c);
    }
    public String getEyelidLeft() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Eyelid_Left__c);
    }
    public String getEyelidRight() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Eyelid_Right__c);
    }
    public String getConjunctivaLeft() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Conjunctiva_Left__c);
    }
    public String getConjunctivaRight() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Conjunctiva_Right__c);
    }
    public String getCorneaLeft() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Cornea_Left__c);
    }
    public String getCorneaRight() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Cornea_Right__c);
    }
    public String getAnteriorChamberLeft() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Anterior_Chamber_Left__c);
    }
    public String getAnteriorChamberRight() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Anterior_Chamber_Right__c);
    }
    public String getAnteriorChamberAngleLeft() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Anterior_Chamber_Angle_Left__c);
    }
    public String getAnteriorChamberAngleRight() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Anterior_Chamber_Angle_Right__c);
    }
    public String getIrisLeft() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Iris_Left__c);
    }
    public String getIrisRight() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Iris_Right__c);
    }
    public String getEyeLensLeft() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Eye_Lens_Left__c);
    }
    public String getEyeLensRight() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Eye_Lens_Right__c);
    }
    public String getVitreousLeft() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Vitreous_Left__c);
    }
    public String getVitreousRight() {
        return convertArrayDataToDisplayString(this.objectiveStatus.Vitreous_Right__c);
    }
    public String getMZLeft() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.MZ_left__c);
    }
    public String getMZRight() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.MZ_right__c);
    }
    public String getViennasLeft() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.Viennas_left__c);
    }
    public String getViennasRight() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.Viennas_right__c);
    }
    public String getArteriesLeft() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.Arteries_left__c);
    }
    public String getArteriesRight() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.Arteries_right__c);
    }
    public String getOpticDiskLeft() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.Optic_disk_left__c);
    }
    public String getOpticDiskRight() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.Optic_disk_right__c);
    }
    public String getPeripheryLeft() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.On_periphery_left__c);
    }
    public String getPeripheryRight() {
        return convertArrayDataToDisplayString(this.eyegroundInvestigation.On_periphery_right__c);
    }
    public String getAppointmentDate() {
        String result = '';
        if (this.doctorAppointment.Appointment_Date__c != NULL) {
            result = this.doctorAppointment.Appointment_Date__c.day() + '/' +
                    this.doctorAppointment.Appointment_Date__c.month() + '/' +
                    this.doctorAppointment.Appointment_Date__c.year();
        }
        return result;
    }
    public String getPatientBirthdate() {
        String result = '';
        if (this.patient.Birthdate != NULL) {
            result = this.patient.Birthdate.day() + '/' +
                    this.patient.Birthdate.month() + '/' +
                    this.patient.Birthdate.year();
        }
        return result;
    }
    public String getPatientName() {
        return this.patient.Contact_Name__c;
    }
    public String getDoctorName() {
        return this.doctor.Contact_Name__c;
    }

    private List<Contact> getContacts(List<String> contactsIds) {
        List<Contact> contacts = [SELECT Birthdate, Contact_Name__c, RecordType.DeveloperName FROM Contact WHERE Id IN :contactsIds];
        return contacts;
    }

    private Eyeground_Investigation__c getEyegroundInvestigation(String eyeGroundId) {
        List<Eyeground_Investigation__c> obSt = [SELECT
                MZ_left__c,
                MZ_right__c,
                On_periphery_left__c,
                On_periphery_right__c,
                Optic_disk_left__c,
                Optic_disk_right__c,
                Viennas_left__c,
                Viennas_right__c,
                Arteries_left__c,
                Arteries_right__c,
                Is_active__c,
                Is_Ophthalmoscopically_Left__c,
                Is_Ophthalmoscopically_Right__c
        FROM Eyeground_Investigation__c
        WHERE Id =: eyeGroundId
        ];
        return obSt.size() > 0 ? obSt[0] : new Eyeground_Investigation__c();
    }

    private Objective_status__c getObjectiveStatus (String objectiveStId) {
        List<Objective_status__c> obSt = [SELECT
                Anterior_Chamber_Angle_Left__c,
                Anterior_Chamber_Angle_Right__c,
                Anterior_Chamber_Left__c,
                Anterior_Chamber_Right__c,
                Anterior_Posterior_Axis_Left__c,
                Anterior_Posterior_Axis_Right__c,
                Axys_Left_Cor__c,
                Axys_Right_Cor__c,
                Central_Corneal_Thickness_Left__c,
                Central_Corneal_Thickness_Right__c,
                Conjunctiva_Left__c,
                Conjunctiva_Right__c,
                Cornea_Left__c,
                Cornea_Right__c,
                Cylinder_Left_Cor__c,
                Cylinder_Right_Cor__c,
                Eye_Lens_Left__c,
                Eye_Lens_Right__c,
                Eye_Position_Left__c,
                Eye_Position_Right__c,
                Eyeground_Left__c,
                Eyeground_Right__c,
                Eyelid_Left__c,
                Eyelid_Right__c,
                Inner_Eye_Pressure_Left__c,
                Inner_Eye_Pressure_Right__c,
                Iris_Left__c,
                Iris_Right__c,
                Sphere_Left_Cor__c,
                Sphere_Right_Cor__c,
                Visus_Left_Cor__c,
                Visus_Left_Eye__c,
                Visus_Right_Cor__c,
                Visus_Right_Eye__c,
                Vitreous_Left__c,
                Vitreous_Right__c,
                Is_active__c,
                Show_visus_correction_left__c,
                Show_visus_correction_right__c
            FROM Objective_status__c
            WHERE Id =: objectiveStId
        ];
        return obSt.size() > 0 ? obSt[0] : new Objective_status__c();
    }

    private String convertArrayDataToDisplayString (String data) {
        String result = '';
        if (String.isNotEmpty(data)) {
            try {
                List<String> rec = (List<String>) JSON.deserialize(data, List<String>.class);
                result = String.join(rec, ', ');
            } catch (JSONException ex) {
                ApexPages.Message myMsg = new ApexPages.Message(ApexPages.Severity.FATAL,ex.getMessage());
                ApexPages.addMessage(myMsg);
                System.debug(ex.getStackTraceString());
            }

        }
        return result;
    }
}