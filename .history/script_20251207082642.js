// ========== script.js ==========

// Helper functions
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}

function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}

function getToday() {
  return new Date().toLocaleDateString();
}

function toggleDisplay(id, show) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("hidden", !show);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function toggleOtherDelivery(show) {
  const otherDiv = document.getElementById("otherDeliveryWrapper");
  if (otherDiv) {
    otherDiv.classList.toggle("hidden", !show);
  }
}

function toggleOtherField(select, otherId) {
  toggleDisplay(otherId, select.value === "other");
}

function toggleHouseholdFields(select) {
  toggleDisplay("maritalOtherField", select.value === "other");
  toggleDisplay("household2Fields", select.value !== "married");
}

function calculateAge() {
  const dob = document.getElementById("dobGregorian").value;
  const ageField = document.getElementById("age");
  if (!dob) return (ageField.value = "");
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
  )
    age--;
  ageField.value = age;
}

function addRow(tableId) {
  const el = document.getElementById(tableId);
  if (!el) return;

  // Handle <tbody> or <table>
  const tbody = el.tagName === "TBODY" ? el : el.querySelector("tbody");
  if (!tbody) return;

  const rows = tbody.getElementsByTagName("tr");
  if (!rows.length) return;

  const newRow = rows[0].cloneNode(true);
  newRow.querySelectorAll("input").forEach(input => input.value = "");
  tbody.appendChild(newRow);
}
// ========= Persistent Form State (per user) =========
const FORM_STATE_VERSION = 'v1'; // bump if your form structure changes

function stateKey(uid) {
  // one key for everything under the protected app (ADIR + Assessments)
  return `caat.formstate.${FORM_STATE_VERSION}.${uid || 'anon'}`;
}

// Save all inputs/selects/textareas inside the protected section
function saveFormState(uid) {
  const root = document.getElementById('protectedAppSection');
  if (!root) return;
  const data = { t: Date.now(), v: FORM_STATE_VERSION, fields: {} };

  const fields = root.querySelectorAll('input, select, textarea');
  fields.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const type = (el.type || '').toLowerCase();

    // build a stable key (prefer id; else name+index)
    let key = el.id || el.name;
    if (!key) return;

    if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
      // store checked state keyed by name+value to support groups
      key = `${el.name}::${el.value}`;
      data.fields[key] = el.checked ? 1 : 0;
    } else {
      data.fields[key] = el.value ?? '';
    }
  });

  try {
    localStorage.setItem(stateKey(uid), JSON.stringify(data));
  } catch (e) {
    console.warn('saveFormState failed:', e);
  }
}

function loadFormState(uid) {
  const root = document.getElementById('protectedAppSection');
  if (!root) return;
  const raw = localStorage.getItem(stateKey(uid));
  if (!raw) return;

  let data;
  try { data = JSON.parse(raw); } catch { return; }
  if (!data || !data.fields) return;

  const fields = root.querySelectorAll('input, select, textarea');
  fields.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const type = (el.type || '').toLowerCase();
    let key = el.id || el.name;
    if (!key) return;

    if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
      key = `${el.name}::${el.value}`;
      if (key in data.fields) el.checked = !!data.fields[key];
    } else if (key in data.fields) {
      el.value = data.fields[key];
    }

    // fire change handlers so your show/hide logic renders correctly
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (tag !== 'select') el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function clearFormState(uid, alsoClearUI = false) {
  localStorage.removeItem(stateKey(uid));
  if (!alsoClearUI) return;

  // Optional: wipe all visible fields
  const root = document.getElementById('protectedAppSection');
  if (!root) return;
  const fields = root.querySelectorAll('input, select, textarea');
  fields.forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const type = (el.type || '').toLowerCase();
    if (tag === 'input' && (type === 'checkbox' || type === 'radio')) {
      el.checked = false;
    } else {
      el.value = '';
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    if (tag !== 'select') el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

document.addEventListener("DOMContentLoaded", () => {
  firebase.auth().onAuthStateChanged((user) => {
    window.currentUser = user;

    const loginSection = document.getElementById("loginSection");
    const protectedAppSection = document.getElementById("protectedAppSection");

    if (!user) {
      // Not logged in
      if (protectedAppSection) protectedAppSection.style.display = "none";
      if (loginSection) loginSection.style.display = "block";
    } else {
      // ========= NEW MASTER / ADMIN LOGIC =========
      (async () => {
        // 1) Start with hard-coded admin email(s)
        const allowedAdmins = ["dr.fraihat@gmail.com"];
        let isMaster = allowedAdmins.includes(user.email);

        try {
          // 2) Read Firestore user doc: /users/{uid}
          const docRef = firebase.firestore().collection("users").doc(user.uid);
          const snap = await docRef.get();
          if (snap.exists) {
            const data = snap.data() || {};

            // role === "master" in Firestore → treat as master
            if (data.role === "master") {
              isMaster = true;
            }

            // Optional: keep these around for later (limits, stats, etc.)
            window.userSubscription = data.subscription || null;
            window.reportsUsed = typeof data.reportsUsed === "number" ? data.reportsUsed : 0;
          }
        } catch (err) {
          console.error("Error reading Firestore user document:", err);
        }

        // 3) Store globally so we can use it in other functions/buttons
        window.isMaster = isMaster;

        // 4) If NOT master → redirect to Stripe (same as before)
        if (!isMaster) {
          if (loginSection) loginSection.style.display = "none";
          if (protectedAppSection) protectedAppSection.style.display = "none";

          fetch("https://caat-backend.onrender.com/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" }
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.url) {
                window.location.href = data.url;
              } else {
                alert("❌ Failed to redirect to payment page.");
              }
            })
            .catch((err) => {
              console.error("Stripe error:", err);
              alert("⚠️ Unable to redirect to payment.");
            });

          return; // ⛔ stop — no access to app
        }

        // 5) MASTER / ADMIN ACCESS ALLOWED → show app
        if (protectedAppSection) protectedAppSection.style.display = "block";
        if (loginSection) loginSection.style.display = "none";

        // ---- Load saved form for this user
        loadFormState(user.uid);

        // ---- Start auto-saving on change/input (debounced)
        const root = document.getElementById("protectedAppSection");
        if (root) {
          let __formSaveTimer = null;
          function __queueSave() {
            clearTimeout(__formSaveTimer);
            __formSaveTimer = setTimeout(() => saveFormState(user.uid), 350);
          }
          root.addEventListener("input", __queueSave, true);
          root.addEventListener("change", __queueSave, true);
        }
      })();
    }

    // ======= Logout button (unchanged) =======
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await firebase.auth().signOut();
          location.reload();
        } catch (e) {
          console.error("Logout failed:", e);
          alert("Logout failed: " + (e?.message || e));
        }
      });
    }

    // ======= Reset button (unchanged) =======
    const resetBtn = document.getElementById("resetFormBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        const ok = confirm("This will clear all locally saved form data on this device. Continue?");
        if (!ok) return;
        clearFormState(user?.uid, /* alsoClearUI */ true);
        alert("All locally saved data cleared.");
      });
    }
  });


  const secondaryLangInput = document.getElementById("secondaryLanguages");
  const exposureWrapper = document.getElementById("languageExposureWrapper");

  function toggleExposureField() {
    const hasSecondary = secondaryLangInput.value.trim().length > 0;
    exposureWrapper.style.display = hasSecondary ? "block" : "none";
  }

  if (secondaryLangInput && exposureWrapper) {
    secondaryLangInput.addEventListener("input", toggleExposureField);
    toggleExposureField(); // Run on page load
  }

  document.querySelectorAll(".tab-container").forEach((tabGroup) => {
  const tabs = tabGroup.querySelectorAll(".tab");
  const tabIds = Array.from(tabs).map((t) => t.getAttribute("data-tab"));
  const containers = tabIds.map((id) => document.getElementById(id)).filter(Boolean);

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      containers.forEach((c) => c.classList.remove("active"));

      tab.classList.add("active");
      containers[index].classList.add("active");
    });
  });
 });





  // ✅ Set default active tab for each tab group
document.querySelectorAll('.tab-container').forEach((tabGroup) => {
  const tabs = tabGroup.querySelectorAll('.tab');
  const tabIds = Array.from(tabs).map((t) => t.getAttribute('data-tab'));
  const containers = tabIds.map((id) => document.getElementById(id)).filter(Boolean);

  const firstVisibleTab = Array.from(tabs).find((tab) => {
    const tabId = tab.getAttribute('data-tab');
    return document.getElementById(tabId);
  });

  const firstVisibleContainer = Array.from(containers).find((container) => {
    return Array.from(tabs).some((tab) => tab.getAttribute('data-tab') === container.id);
  });

  if (firstVisibleTab && firstVisibleContainer) {
  firstVisibleTab.classList.add("active");
  firstVisibleContainer.classList.add("active");
}

// ✅ Yes/No toggle fields for "Other" answers
document.querySelectorAll(".toggle-field").forEach(select => {
  const targetId = select.getAttribute("data-toggle-target");
  if (!targetId) return;
  select.addEventListener("change", () => toggleOtherField(select, targetId));
  toggleOtherField(select, targetId); // Run once on load
});

// ✅ Household Status toggle (married vs other)
const householdSelect = document.getElementById("householdStatus");
if (householdSelect) {
  householdSelect.addEventListener("change", () => toggleHouseholdFields(householdSelect));
  toggleHouseholdFields(householdSelect); // Run once on load
}

// ✅ Delivery method toggle
const deliveryRadios = document.querySelectorAll('input[name="deliveryMode"]');
deliveryRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    const selected = document.querySelector('input[name="deliveryMode"]:checked')?.value;
    toggleDisplay("csectionReasonWrapper", selected === "c-section");
    toggleDisplay("otherDeliveryWrapper", selected === "other");
  });
});

// Run toggle display on load in case already selected
const selectedDelivery = document.querySelector('input[name="deliveryMode"]:checked')?.value;
toggleDisplay("csectionReasonWrapper", selectedDelivery === "c-section");
toggleDisplay("otherDeliveryWrapper", selectedDelivery === "other");

// ✅ Marital status toggle (to show Household 2 and "Other" text box)
const maritalSelect = document.getElementById("parentMaritalStatus");
if (maritalSelect) {
  maritalSelect.addEventListener("change", () => toggleHouseholdFields(maritalSelect));
  toggleHouseholdFields(maritalSelect); // Run once on page load
}
});
// ✅ Nested Tab Switching for Comprehensive Assessment
const compContainer = document.getElementById("comprehensiveAssessment");
if (compContainer) {
  compContainer.querySelectorAll(".tab-container").forEach((tabGroup) => {
    const tabs = tabGroup.querySelectorAll(".tab");
    const tabIds = Array.from(tabs).map((t) => t.getAttribute("data-tab"));
    const containers = tabIds.map((id) => document.getElementById(id)).filter(Boolean);

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        containers.forEach((c) => c.classList.remove("active"));

        tab.classList.add("active");
        containers[index].classList.add("active");
      });
    });

    // Set default active tab for nested group
    const firstTab = Array.from(tabs).find((tab) => {
      const tabId = tab.getAttribute("data-tab");
      return document.getElementById(tabId);
    });
    const firstContainer = Array.from(containers).find((container) => {
      return Array.from(tabs).some((tab) => tab.getAttribute("data-tab") === container.id);
    });
    if (firstTab && firstContainer) {
      firstTab.classList.add("active");
      firstContainer.classList.add("active");
    }
  });
}

}); // End of DOMContentLoaded





function showLoading() {
  document.getElementById("loadingOverlay").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

function toggleLanguageDropdown() {
  const menu = document.getElementById("languageDropdown");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}

document.addEventListener("click", function (event) {
  const dropdown = document.querySelector(".dropdown-wrapper");
  if (dropdown && !dropdown.contains(event.target)) {
    document.getElementById("languageDropdown").style.display = "none";
  }
});

// ✅ Allow only one checkbox to be selected
document.addEventListener("change", function (event) {
  if (event.target.name === "reportLanguages" && event.target.type === "checkbox") {
    document.querySelectorAll('input[name="reportLanguages"]').forEach(cb => {
      if (cb !== event.target) cb.checked = false;
    });
  }
});


let currentLanguage = "en";

const translations = {
  en: {
    intakeTab: "Autism Diagnostic Intake Report (ADIR)",
    signSubmit: "Sign, Submit, And Generate Autism Diagnostic Intake Report (ADIR)",
    generateAI: "Generate Autism Diagnostic Intake Report (ADIR)",
    signature: "Signature",
    recommendations: "Recommendations",
    selectLanguage: "Select Language:"
        ,demographicSummary: "Demographic Summary",
    backgroundHistory: "Background and History",
    clinicalObservations: "Clinical Observation Summary",
    dsm5Evaluation: "DSM-5 Diagnostic Criteria Evaluation for ASD",
    childFirstName: "Child’s First Name",
        fullNameLabel: "Child's Full Name",
    preferredNameLabel: "Preferred Name (Nickname)",
    ageLabel: "Age",
genderLabel: "Gender",
dobLabel: "Date of Birth",
primaryLangLabel: "Primary Language",
secondaryLangLabel: "Secondary Languages",
maritalStatusLabel: "Marital Status of Parents/Guardians",
household1Label: "Primary Household Guardian",
residence1Label: "Residence Time (Primary Household)",
household1MembersLabel: "Household Members (Primary)",
household2Label: "Secondary Household Guardian",
residence2Label: "Residence Time (Secondary Household)",
household2MembersLabel: "Household Members (Secondary)",
siblingsLabel: "Siblings Not in the Household",
extendedFamilyLabel: "Extended Family Involvement",
primaryConcernsLabel: "Primary Concerns",
desiredOutcomesLabel: "Desired Outcomes",
additionalNotesLabel: "Additional Notes",
motherAgeLabel: "Mother's Age at Birth",
fatherAgeLabel: "Father's Age at Birth",
consanguinityLabel: "Degree of Consanguinity",
motherEduLabel: "Mother’s Occupation & Education",
fatherEduLabel: "Father’s Occupation & Education",
pregnancyCountLabel: "Number of Pregnancies",
liveBirthsLabel: "Live Births",
stillBirthsLabel: "Still Births",
pregnancyPlannedLabel: "Was Pregnancy Planned?",
fertilityLabel: "Fertility Treatments",
medicationsLabel: "Medications/Vitamins During Pregnancy",
multipleBirthLabel: "Part of a Multiple Birth",
drugUseLabel: "Substance Use During Pregnancy",
complicationsLabel: "Pregnancy Complications",
pitocinLabel: "Pitocin Used",
deliveryLabel: "Delivery Mode",
prematureLabel: "Premature Birth",
laborCompLabel: "Labor/Delivery Complications",
nicuLabel: "NICU Admission",
neonatalCompLabel: "Neonatal Complications in Hospital",
dietaryHeading: "Dietary Considerations",
allergiesLabel: "Allergies",
specialDietLabel: "Special Diet",

milestonesHeading: "Developmental Milestones",
socialMilestonesLabel: "Social-Emotional",
cognitiveMilestonesLabel: "Cognitive",
languageMilestonesLabel: "Language",
physicalMilestonesLabel: "Physical",

dailyLivingHeading: "Daily Living Skills",
groomingLabel: "Grooming/Hygiene",
feedingLabel: "Feeding",
dressingLabel: "Dressing",
foodSleepLabel: "Requesting Food/Sleep",
regressionLabel: "Loss of Previously Learned Skills",

sensoryHeading: "Sensory Profile",
affectLabel: "Affect / Activity / Attention Traits",
domainSensoryLabel: "Sensory Domain Concerns",
reactionsLabel: "Reactions to Sensory Input",

educationHeading: "Educational History",
schoolLabel: "Currently Enrolled in School",
gradeLabel: "Program / Grade Level",
attendanceLabel: "Attendance Frequency",
accommodationsLabel: "Special Services/Accommodations",
handLabel: "Hand Preference",
repeatedGradesLabel: "Repeated Grades",
learningLabel: "Learning Challenges",
weekdayLabel: "Typical Weekday Routine",
weekendLabel: "Typical Weekend Routine",
hobbiesLabel: "Interests & Hobbies",
strengthsLabel: "Strengths",
behaviorHeading: "Behavioral Summary",
problemBehaviorLabel: "Reported Problem Behaviors",
behaviorObservationLabel: "Caregiver Observations",
socialFunctioningLabel: "Social Functioning",
traumaLabel: "Exposure to Trauma",
stressorsLabel: "Recent Stressors",
behaviorNotesLabel: "Additional Behavioral Comments",
signatureHeading: "Signature",
caseManagerNameLabel: "Case Manager Name",
caseManagerSignatureLabel: "Signature",
submissionDateLabel: "Date of Submission",
confirmationStatement: "This report has been reviewed and signed by the responsible clinician to affirm the accuracy and completeness of the information presented.",
childMiddleName: "Child’s Middle Name",
childLastName: "Child’s Last Name",
nationalId: "National ID",
guardianName: "Guardian Name",
relationshipToChild: "Relationship to Child",
languageOther: "Other Language",
parentMaritalStatus: "Marital Status",
maritalOther: "Other Marital Status",
household1Name: "Primary Household Guardian",
household1Members: "Household Members (Primary)",
household2Name: "Secondary Household Guardian",
household2Members: "Household Members (Secondary)",
residence1: "Residence Time (Primary Household)",
residence2: "Residence Time (Secondary Household)",
siblingNames: "Siblings Not in the Household",
primaryConcerns: "Primary Concerns",
desiredOutcomes: "Desired Outcomes",
additionalNotes: "Additional Notes",
motherOccEdu: "Mother’s Occupation & Education",
fatherOccEdu: "Father’s Occupation & Education",
numMotherPregnancies: "Number of Pregnancies",
liveBirths: "Live Births",
stillBirths: "Still Births",
pregnancyPlanned: "Was Pregnancy Planned?",
fertilityTreatments: "Fertility Treatments",
tookMedicationsYesNo: "Took Medications?",
pregMedications: "Medications Taken",
pregMedOther: "Other Medications",
multipleBirthNew: "Multiple Birth",
multipleBirthType: "Type of Multiple Birth",
identicalOrFraternal: "Identical or Fraternal",
pregDrugUsed: "Used Substances During Pregnancy?",
pregDrugSpec: "Substances Used",
difficultPregYesNo: "Pregnancy Complications?",
pregnancyDifficulties: "Complications During Pregnancy",
pregDiffExplain: "Explanation of Complications",
pitocinUsedNew: "Pitocin Used",
deliveryMode: "Delivery Mode",
csectionReasonNew: "C-Section Reason",
prematureBirthNew: "Premature Birth",
prematureWeeksNew: "Weeks Premature",
laborDeliveryComplications: "Labor/Delivery Complications",
ldComplicationsSpecify: "Specify Labor Complications",
nicuAdmitNew: "NICU Admission",
nicuDischargedDays: "NICU Duration (days)",
nicuReasonNew: "NICU Reason",
problemsInHospitalYesNo: "Neonatal Complications",
hospitalProblems: "Complications in Hospital",
currentAllergies2: "Has Allergies?",
allergiesList2: "List of Allergies",
specialDiet2: "On Special Diet?",
specialDietChecklist: "Special Diet Details",
devSocial: "Social Development",
devCognitive: "Cognitive Development",
devLanguage: "Language Development",
langApproxWords: "Approximate Words Used",
devPhysical: "Physical Development",
devGrooming: "Grooming Skills",
devFeeding: "Feeding Skills",
devDressing: "Dressing Skills",
foodSleepReq2: "Requests Food/Sleep",
lossSkill2: "Lost Skills?",
lossSkillExplain2: "Explanation of Lost Skills",
lossSkillAge2: "Age of Skill Loss",
affectTraits: "Emotional Traits",
sensVision: "Vision",
sensTactile: "Tactile",
sensHearing: "Hearing",
sensTaste: "Taste",
sensBodyAwareness: "Body Awareness",
sensSmell: "Smell",
sensVestibular: "Vestibular",
sensInteroception: "Interoception",
sensReacts: "Reactions to Sensory Input",
currentSchool: "Currently Enrolled?",
schoolName: "School Name",
programGradeLevel: "Program / Grade Level",
attendanceFrequency: "Attendance Frequency",
specialServicesAccom: "Special Services",
specialServicesType: "Type of Services",
handPreference: "Hand Preference",
gradesRepeated: "Repeated Grades",
learningChallenges: "Learning Challenges",
learningChallengesExplain: "Explanation of Learning Challenges",
weekdaySchedule: "Weekday Routine",
weekendSchedule: "Weekend Routine",
interestsHobbies: "Interests & Hobbies",
patientStrengths: "Strengths",
problemBehaviors: "Problem Behaviors",
behaviorConcerns: "Behavioral Concerns",
friendsEasily2: "Makes Friends Easily?",
explainFriends2: "Explain Social Difficulty",
socialConcerns2: "Social Concerns?",
explainSocialConcerns2: "Explain Social Concerns",
abuseNeglectHistory: "Trauma Exposure",
abuseNeglectExplain: "Trauma Details",
recentStressors2: "Recent Stressors?",
explainStressors2: "Explain Stressors",
behaviorAdditionalComments: "Additional Behavior Notes",
caseManager: "Case Manager Name",
caseManagerSignature: "Signature",
intakeDate: "Date of Submission",
household1Title: "Household 1 Details",
household2Title: "Household 2 Details",
household1Name: "Parent/Guardian Name",
household2Name: "Parent/Guardian Name",
householdMembers: "Others in the Home",
male: "Male",
female: "Female",
other: "Other",
married: "Married",
divorced: "Divorced",
separated: "Separated",
langArabic: "Arabic",
langEnglish: "English",
languageExposure: "Percentage of exposure to non-primary language(s)",
thName: "Name",
thSex: "Sex",
thAge: "Age",
thRelation: "Relation",
addRow: "Add Row",
tabDemographic: "Demographic Information",
tabBackground: "Background and History",
tabObservation: "Observation Notes",
tabGenerateADIR: "Sign, Submit, And Generate Autism Diagnostic Intake Report (ADIR)",
assessmentGroupTitle: "Comprehensive Assessment",
    tabPsychological: "Psychological Assessment",
    tabOccupational: "Occupational Assessment",
    tabSpeech: "Speech and Language Assessment",
    tabBehavioral: "Applied Behavior Analysis Assessment",
    tabSpecialEducation: "Special Education Assessment",
    tabVocational: "Vocational Assessment",
    tabSignSubmit: "Sign, Submit, and Generate Comprehensive Report",
adirTitle: "Autism Diagnostic Intake Report (ADIR)",
historySectionTitle: "Section 2: Background and History",
pregnancyTitle: "PREGNANCY & BIRTH HISTORY",
motherAgeLabel: "Biological Mother's Age at Birth",
fatherAgeLabel: "Biological Father's Age at Birth",
consanguinityLabel: "Degree of Consanguinity",
firstDegree: "First Degree",
secondDegree: "Second Degree",
none: "No",
motherEduLabel: "Primary Caregiver's Occupation & Education (Mother)",
fatherEduLabel: "Primary Caregiver's Occupation & Education (Father)",
pregnancyCountLabel: "Number of Times Biological Mother Has Been Pregnant",
liveBirthsLabel: "Live Births",
stillBirthsLabel: "Still Births",
pregnancyPlannedLabel: "Was the child's pregnancy planned?",
yes: "Yes",
no: "No",
fertilityTreatmentsLabel: "Were there fertility treatments?",
unsure: "Unsure",
medicationsDuringPregnancy: "Did the birth mother take any medications, vitamins or supplements during pregnancy?",
checkAllThatApply: "(Check all that apply)",
vitamins: "Vitamins",
supplements: "Supplements",
depakote: "Depakote (Valproic Acid)",
lithium: "Lithium",
antidepressants: "Antidepressants",
antiepileptics: "Anti-epileptics / Anti-seizure",
otherMedication: "Other",
multipleBirth: "Was the patient part of a multiple birth pregnancy? (e.g., twins)",
multipleBirthLabel: "Were there multiple births (if any)?",
typeLabel: "Type:",
twins: "Twins",
triplets: "Triplets",
quadruplets: "Quadruplets",
identical: "Identical",
fraternal: "Fraternal",
both: "Both",
substanceUse: "Did the birth mother use any alcohol, tobacco or recreational drugs during pregnancy?",
specifyIfYes: "Specify if yes:",
pregnancyComplications: "Were there any difficulties during pregnancy?",
fever: "Fever",
infection: "Infection",
spotting: "Spotting/Bleeding",
miscarriage: "Threatened Miscarriage",
highBP: "High Blood Pressure",
diabetes: "Gestational Diabetes",
rh: "RH Incompatibility",
stress: "Severe Stress",
accidents: "Accidents",
explainComplications: "If “Yes” to any of the above, please explain:",
laborDeliveryTitle: "LABOR & DELIVERY",
pitocinLabel: "Were medications used to induce or augment labor?",
prematureBirthLabel: "Was the patient born premature?",
prematureWeeks: "If yes, how many weeks?",
laborComplications: "Were there complications during labor or delivery?",
hospitalProblemsLabel: "Did the patient experience any problems while still in the hospital?",
nicuLabel: "Was the patient admitted to the NICU?",
nicuDays: "If yes, how old was client at discharge (days)?",
nicuReason: "Why was the patient admitted?",
deliveryModeLabel: "The delivery was:",
deliveryComplicationsLabel: "Any labor or delivery complications?",
vaginal: "Vaginal",
csection: "C-section",
breech: "Breech",
forceps: "Forceps",
cordAround: "Cord around neck",
feedingDiff: "Feeding difficulties",
hospitalInfection: "Infections",
sleepingProblems: "Sleeping problems",
jaundice: "Jaundice",
birthDefects: "Birth defects",
seizures: "Seizures",
unconscious: "Lose consciousness",
excessCry: "Excessive crying",
gi: "GI symptoms (diarrhea, constipation, nausea, retching, regurgitation)",
dietCamsTitle: "Diet and CAMS",
hasAllergies: "Does the child have any current Allergies?",
onSpecialDiet: "Is the child on a special diet?",
ifYesDietLabel: "If Yes, please identify below:",
glutenFree: "Gluten free diet",
caseinFree: "Casein free diet",
noSugar: "No processed sugars",
noSalicylates: "No sugars or salicylates",
feingoldDiet: "Feingold diet",
otherDiet: "Other",
devHistoryTitle: "DEVELOPMENTAL HISTORY",
devInstructions: "(Check all milestones achieved)",
socialHeading: "Social/Emotional:",
socSmile: "smile",
socLookFace: "look at your face",
socLaughs: "laughs",
socKnowsFamily: "knows family members",
socShy: "shy",
socFearful: "fearful",
socRespondName: "respond to name",
socPlayGames: "play games",
socClapping: "clapping when excited",
socAffection: "shows affection",
socNoticesEmotion: "notices people’s emotions",
socPlayNext: "plays next to other children",
socFollowRoutine: "follows simple routine",
languageHeading: "Language/ Communication:",
langBabbling: "babbling",
langCooing: "cooing",
langPointing: "pointing",
langTwoSounds: "two sounds (mamama)",
langFirstWord: "first word",
langNamesObjects: "names objects",
lang2_3Words: "2-3 words",
langTurnTaking: "turn-taking",
lang3PlusWords: "3+ words",
langPointsItems: "points to items when asked “where is __?”",
langUsesGestures: "Uses gestures",
langConversation: "conversation",
langWhQuestions: "ask WH-questions",
langSaysName: "says first name",
langTellsStory: "tells a story",
langUseAAC: "Use AAC",
langApprox: "Approx words (if known):",
cognitiveHeading: "Cognitive:",
cogLookToys: "looks at toys",
cogMouth: "put things in mouth",
cogMissing: "looks for missing items",
cogStacks: "stacks objects",
cogCopies: "copies adults",
cog1Step: "Follows 1-step direction",
cogSimplePlay: "plays with toys in simple ways",
cogTwoHands: "uses two hands simultaneously",
cogPretend: "pretend play",
cogProblem: "problem solving",
cogColors: "knows colors",
cog2Step: "Follow 2-step directions",
cogImitation: "imitation",
cogDanger: "recognizes danger",
cogAvoid: "avoids danger",
physicalHeading: "Physical / Movement:",
phyRoll: "roll",
phySitUp: "sit up",
phyCrawl: "crawl",
phyWalk: "walk",
phyJump: "jump",
phyStair: "staircase",
phyTricycle: "tricycle",
phyPencil: "holds pencil",
phyScribble: "scribble",
phyKick: "kicks ball",
phyCatch: "catches ball",
dailyLivingHeading: "Daily Living Skills:",
groomingHeading: "Grooming/Hygiene:",
toileting: "toileting",
brushHair: "brush hair",
brushTeeth: "brush teeth",
washHands: "wash hands",
washFace: "wash face",
bathing: "showering / bathing",
feedingHeading: "Feeding:",
useUtensils: "use utensils",
drinkCup: "drink from cup / straw",
feedFingers: "fingers to feed",
servesFood: "serves food",
messyEater: "messy eater",
pickyEater: "picky eater / problem eater",
dressingHeading: "Dressing:",
buttonClothes: "button clothes",
zipsClothes: "zips clothes",
offShoes: "takes off shoes/socks",
tieShoes: "tie shoelaces",
offClothes: "takes clothes off",
foodSleepLabel: "How does your child ask for food? Sleep?",
regressionLabel: "Has the patient ever had loss or regression of a previously learned skill?",
lossSkillAge: "At what age did you first notice the loss of skill?",
sensoryHeading: "Sensory Integration / Regulation",
affectLabel: "Describe your child’s overall affect, activity level, and attention (check all that apply):",
affectQuiet: "mostly quiet",
affectActive: "overly active",
affectTires: "tires easily",
affectTalkative: "talkative",
affectImpulsive: "impulsive",
affectResistant: "resistant to change",
affectClumsy: "clumsy",
affectNervous: "nervous habits",
affectStubborn: "stubborn",
affectHappy: "happy",
affectSeparation: "difficulty separating from caregiver",
domainSensoryLabel: "Are there concerns regarding any of the following areas?",
reactionsLabel: "Reaction to these sensitivities (check all that apply):",
sensCrying: "crying",
sensRunning: "running away",
sensEars: "hands over ears",
normal: "Normal",
high: "High",
low: "Low",
sensVisionLabel: "Vision (flickering lights, spin)",
sensTactileLabel: "Tactile (shaving, nails, textures)",
sensHearingLabel: "Hearing (vacuum, toilet flushing)",
sensTasteLabel: "Taste (mouthing)",
sensBodyLabel: "Body Awareness (pain tolerance, jumping, running)",
sensSmellLabel: "Smell (smells objects/people)",
sensVestibularLabel: "Vestibular (spinning, balance, falling)",
sensInteroceptionLabel: "Interoception (feels hungry, constipation)",
educationHeading: "Educational History",
schoolLabel: "Is the patient currently enrolled in school?",
gradeLabel: "Program or Grade level:",
attendanceLabel: "How often does the child attend?",
accommodationsLabel: "Is the patient receiving or has the patient received special services or accommodations at school?",
handLabel: "Hand preference:",
repeatedGradesLabel: "Have any grades been repeated?",
learningLabel: "Has the patient experienced any challenges related to reading, math or writing?",
weekdayLabel: "Typical Day: Please describe a Typical Weekday and Weekend",
hobbiesLabel: "What are the patient’s interests and hobbies?",
strengthsLabel: "What are some of the patient’s strengths?",
right: "Right",
left: "Left",
behaviorHeading: "Problem Behavior(s)",
behaviorAreasLabel: "Are there concerns regarding any of the following areas?",
pbAggression: "Aggression Toward Others",
pbSelfInjury: "Self-Injurious Behavior",
pbTransitions: "Difficulty with Transitions",
pbInappropriateConv: "Inappropriate Conversation",
pbInappropriateBehavior: "Inappropriate Behavior",
pbRitualistic: "Ritualistic Behavior",
pbRepetitive: "Repetitive Behavior",
pbFixations: "Fixations (shows, numbers, objects)",
behaviorDescribe: "Please describe any behavioral concerns you have at this time:",
friendsLabel: "Does the patient make friends easily?",
socialLabel: "Are there any concerns regarding the patient’s social skills or interests?",
abuseLabel: "Has the patient been exposed to any form of abuse, neglect or domestic violence?",
stressLabel: "Has the patient experienced any recent significant stressors (e.g. moves, losses)?",
behaviorNotesLabel: "Additional Comments:",
medicalHistoryHeading: "MEDICAL HISTORY & EVALUATIONS",
medicalPrompt: "For each condition/symptom below, please indicate if it is/was a health problem:",
yes: "Yes",
no: "No",
unsure: "Unsure",
condSleep: "Sleep",
condBlood: "Blood / Anemia",
condVision: "Vision",
condSkin: "Skin condition",
condHearing: "Hearing",
condEndocrine: "Endocrine or hormone",
condDental: "Dental",
condSeizures: "Seizures",
condHeart: "Heart",
condHeadInjury: "Head injury",
condAsthma: "Asthma",
condFailureThrive: "Failure to Thrive",
condNausea: "Nausea / Vomiting",
condFeeding: "Feeding",
evalPrompt: "2. Has the patient had any of the following evaluations? If yes, (Please provide supporting documentation)",
evalHeader: "Evaluations",
yesNoUnsure: "Yes / No / Unsure",
normalAbnormal: "Normal / Abnormal",
evalAudiological: "Audiological Evaluation",
evalVision: "Vision Evaluation",
evalHeadImaging: "Head Imaging (MRI, CT, Ultrasound)",
evalGenetic: "Genetic Testing",
evalEEG: "EEG",
evalPsych: "Psychological Evaluation (e.g., IQ)",
evalOther: "Other Evaluations, Procedures or Results:",
evalAbnormalExplain: "If any of the above were “Abnormal,” please explain:",
normal: "Normal",
abnormal: "Abnormal",
diagnosisPrompt: "3. Please indicate whether your child has ever been diagnosed with or suspected of having any of the following conditions:",
conditionLabel: "Disorder / Condition",
diagnosisStatus: "Status (Diagnosed / Suspected / Never)",
diagnosisReport: "Report",
diagnosed: "Diagnosed",
suspected: "Suspected",
never: "Never",
condDown: "Down Syndrome",
condADHD: "Attention Deficit Hyperactivity Disorder (ADHD) / ADD",
condASD: "Autism Spectrum Disorder (ASD)",
condDD: "Developmental Delay / Intellectual Disability",
condOther: "Other",
biomedPrompt: "4. Please list any other biomedical interventions:",
biomedMedication: "Medication",
biomedDosage: "Dosage / Time",
biomedDuration: "Duration",
biomedComments: "Comments",
addRowBtn: "Add Row",
therapyPrompt: "5. Has the patient ever been seen by an Occupational Therapist, Speech and Language Therapist, Psychiatrist, Psychologist, or other mental health counselor?",
ifYesTherapyInfo: "If yes, please provide the following information:",
therapyType: "Current Therapy History",
agencyTherapist: "Agency / Therapist",
duration: "Duration",
evalAvailable: "Evaluations available for review?",
improvements: "Improvements?",
therapyOT: "Occupational therapy",
therapyPT: "Physical therapy",
therapySLP: "Speech/Language therapy",
therapyPsych: "Psychology",
therapyABA: "Behavioral therapy",
therapyOther: "Other:",
additionalNotes: "Additional Notes:",
obsHeader: "Observation Notes",
obsSection1: "1. General Appearance and Behavior",
obsGroomed: "Child is well-groomed / wearing appropriate clothing?",
obsFacial: "Child's facial expression is typical / neutral?",
obsActivity: "Child's activity level appears age-appropriate?",
obsTransitions: "Child manages transitions calmly (no major distress)?",
obsSection2: "2. Interaction with Parent/Guardian",
obsAttachment: "Child displays secure attachment / seeks proximity to parent?",
obsSeparation: "Child shows separation anxiety when parent leaves?",
obsCompliance: "Child generally complies with parent's instructions or redirections?",
obsSection3: "3. Social Interaction with Clinician",
obsInitiation: "Child initiates social interaction (talking, gestures) with clinician?",
yes: "Yes",
no: "No",
obsEyeContact: "Child makes eye contact spontaneously?",
obsSharedAttention: "Child shares enjoyment / joint attention with clinician?",
obsSection4: "4. Communication and Language",
obsVerbal: "Child uses verbal communication (phrases, sentences) spontaneously?",
obsEcholalia: "Child displays echolalia or repeated speech patterns?",
obsNonverbal: "Child uses nonverbal communication (gestures, sign, PECS) effectively?",
obsSection5: "5. Motor Skills and Movement",
obsFlapping: "Any hand-flapping or stimming observed?",
obsTiptoe: "Child walks or runs on tiptoes?",
obsFineMotor: "Fine motor skills appear age-appropriate? (picking small objects, drawing, etc.)",
obsSection6: "6. Emotional Regulation and Affect",
obsMood: "Child appears calm / content most of the session?",
obsFrustration: "Child tolerates minor frustrations without significant meltdown?",
obsCalming: "Child self-regulates or quickly calms with minimal support?",
obsSection7: "7. Play and Engagement",
obsImaginativePlay: "Child engages in imaginative or pretend play?",
obsConstructivePlay: "Child enjoys constructive play (blocks, puzzles) or similar?",
obsRepetitivePlay: "Child demonstrates repetitive or fixated patterns of play?",
obsSection8: "8. Sensory Responses",
obsNoise: "Child reacts strongly to loud/unexpected noises?",
obsTouch: "Child avoids or seeks certain tactile input?",
obsVisual: "Child seems fascinated or averse to spinning objects/lights?",
obsSection9: "9. Perseverations, Rituals, Rigidities",
obsRoutines: "Child strongly adheres to routines / shows distress if disrupted?",
obsFixations: "Child exhibits fixations on certain shows, objects, or numbers?",
obsSection10: "10. Cooperation and Attention",
obsCompliance: "Child is generally compliant with instructions?",
obsAttention: "Child maintains attention to tasks or easily distracted?",
obsSection11: "11. Notable Strengths",
obsStrengthsPlaceholder: "Describe any positive skills or behaviors...",
obsSection12: "12. Concerns / Additional Comments",
obsConcernsPlaceholder: "Describe any particularly concerning behaviors...",
signSubmitHeading: "Sign, Submit & Generate Intake Report",
caseManagerNameLabel: "Case Manager Name",
caseManagerSignatureLabel: "Case Manager Signature",
submissionDateLabel: "Date",
generateAI: "Generate Autism Diagnostic Intake Report (ADIR) List",
generateListReport: "Generate Autism Diagnostic Intake Report (ADIR) List",
csectionReasonPlaceholder: "Reason for C-Section",
milestoneOnTime: "Yes, on time",
milestoneDelayed: "Yes, but delayed",
milestoneNotAchieved: "Not achieved",
soc_smile: "Smile",
soc_lookFace: "Look at your face",
soc_laughs: "Laughs",
soc_knowsFamily: "Knows family members",
soc_shy: "Shy",
soc_fearful: "Fearful",
soc_respondName: "Respond to name",
soc_playGames: "Play games",
soc_clapping: "Clapping when excited",
soc_showsAffection: "Shows affection",
soc_noticesEmotion: "Notices emotions",
soc_playNext: "Plays near others",
soc_followRoutine: "Follows routine",
cogLookToys: "Looks at toys",
cogMouth: "Puts things in mouth",
cogMissing: "Looks for missing items",
cogStacks: "Stacks objects",
cogCopies: "Copies adults",
cog1Step: "Follows 1-step direction",
cogSimplePlay: "Plays with toys in simple ways",
cogTwoHands: "Uses two hands simultaneously",
cogPretend: "Pretend play",
cogProblem: "Problem solving",
cogColors: "Knows colors",
cog2Step: "Follows 2-step directions",
cogImitation: "Imitation",
cogDanger: "Recognizes danger",
cogAvoid: "Avoids danger",
langBabbling: "Babbling",
langCooing: "Cooing",
langPointing: "Pointing",
langTwoSounds: "Two sounds (mamama)",
langFirstWord: "First word",
langNamesObjects: "Names objects",
lang2_3Words: "2-3 words",
langTurnTaking: "Turn-taking",
lang3PlusWords: "3+ words",
langPointsItems: "Points to items when asked 'where is ___?'",
langUsesGestures: "Uses gestures",
langConversation: "Conversation",
langWhQuestions: "Asks WH-questions",
langSaysName: "Says first name",
langTellsStory: "Tells a story",
langUseAAC: "Uses AAC",
phyRoll: "Roll",
phySitUp: "Sit up",
phyCrawl: "Crawl",
phyWalk: "Walk",
phyJump: "Jump",
phyStair: "Staircase",
phyTricycle: "Tricycle",
phyPencil: "Holds pencil",
phyScribble: "Scribble",
phyKick: "Kicks ball",
phyCatch: "Catches ball",
toileting: "Toileting",
brushHair: "Brush hair",
brushTeeth: "Brush teeth",
washHands: "Wash hands",
washFace: "Wash face",
bathing: "Showering / bathing",

useUtensils: "Use utensils",
drinkCup: "Drink from cup / straw",
feedFingers: "Fingers to feed",
servesFood: "Serves food",
messyEater: "Messy eater",
pickyEater: "Picky eater / problem eater",

buttonClothes: "Button clothes",
zipsClothes: "Zips clothes",
offShoes: "Takes off shoes/socks",
tieShoes: "Tie shoelaces",
offClothes: "Takes clothes off",
milestoneLabel: "Milestone",
aiReportListTitle: "AI Generated Autism Diagnostic Intake Report (ADIR) List",
generateListReport: "Generate Autism Diagnostic Intake Report (ADIR) List",
csectionReasonLabel: "Reason for C-Section:"

  },
  ar: {
    intakeTab: "التقييم التشخيصي للتوحد (ADIR)",
    signSubmit: "توقيع وارسال تقريرالتقييم التشخيصي للتوحد",
    generateAI: "إنشاء تقرير التقييم التشخيصي للتوحد (ADIR)",
    signature: "التوقيع",
    recommendations: "التوصيات",
    selectLanguage: "اختر اللغة:"
        ,demographicSummary: "الملف الديموغرافي",
    backgroundHistory: "الخلفية والسجل الطبي",
    clinicalObservations: "ملاحظات التقييم الإكلينيكي",
    dsm5Evaluation: "تقييم معايير DSM-5 للتوحد",
    childFirstName: "الاسم الأول للطفل",
    fullNameLabel: "الاسم الكامل للطفل",
    preferredNameLabel: "الاسم المفضل (اللقب)",
    ageLabel: "العمر",
genderLabel: "الجنس",
dobLabel: "تاريخ الميلاد",
primaryLangLabel: "اللغة الأساسية",
secondaryLangLabel: "اللغات الثانوية",
maritalStatusLabel: "الحالة الاجتماعية للوالدين/الأوصياء",
household1Label: "الوصي في المنزل الأساسي",
residence1Label: "مدة الإقامة في المنزل الأساسي",
household1MembersLabel: "أفراد المنزل (الأساسي)",
household2Label: "الوصي في المنزل الثانوي",
residence2Label: "مدة الإقامة في المنزل الثانوي",
household2MembersLabel: "أفراد المنزل (الثانوي)",
siblingsLabel: "الأشقاء غير المقيمين في المنزل",
extendedFamilyLabel: "مشاركة الأسرة الممتدة",
primaryConcernsLabel: "المخاوف الرئيسية",
desiredOutcomesLabel: "الأهداف المرجوة",
additionalNotesLabel: "ملاحظات إضافية",
motherAgeLabel: "عمر الأم عند الولادة",
fatherAgeLabel: "عمر الأب عند الولادة",
consanguinityLabel: "درجة القرابة",
motherEduLabel: "وظيفة وتعليم الأم",
fatherEduLabel: "وظيفة وتعليم الأب",
pregnancyCountLabel: "عدد مرات الحمل",
liveBirthsLabel: "الولادات الحية",
stillBirthsLabel: "الولادات المتوفاة",
pregnancyPlannedLabel: "هل كان الحمل مخططًا؟",
fertilityLabel: "علاجات الخصوبة",
medicationsLabel: "الأدوية/الفيتامينات أثناء الحمل",
multipleBirthLabel: "جزء من ولادة متعددة",
drugUseLabel: "تعاطي مواد أثناء الحمل",
complicationsLabel: "مضاعفات الحمل",
pitocinLabel: "هل استُخدمت أدوية لتحفيز أو تسريع الولادة؟",
deliveryLabel: "طريقة الولادة",
prematureLabel: "هل كانت الولادة مبكرة؟",
laborCompLabel: "مضاعفات أثناء المخاض/الولادة",
nicuLabel: "دخول وحدة العناية المركزة لحديثي الولادة",
neonatalCompLabel: "المضاعفات في المستشفى بعد الولادة",
dietaryHeading: "الاعتبارات الغذائية",
allergiesLabel: "الحساسية",
specialDietLabel: "النظام الغذائي الخاص",

milestonesHeading: "معالم النمو",
socialMilestonesLabel: "اجتماعي / عاطفي",
cognitiveMilestonesLabel: "المعرفي",
languageMilestonesLabel: "اللغة",
physicalMilestonesLabel: "الحركي",

dailyLivingHeading: "مهارات الحياة اليومية",
groomingLabel: "النظافة الشخصية",
feedingLabel: "التغذية",
dressingLabel: "اللباس",
foodSleepLabel: "طلب الطعام / النوم",
regressionLabel: "فقدان المهارات المكتسبة سابقًا",

sensoryHeading: "الملف الحسي",
affectLabel: "الحالة العامة / النشاط / الانتباه",
domainSensoryLabel: "المجالات الحسية المتأثرة",
reactionsLabel: "ردود الفعل تجاه المدخلات الحسية",

educationHeading: "التاريخ التعليمي",
schoolLabel: "مسجل حاليًا في مدرسة",
gradeLabel: "الصف / البرنامج",
attendanceLabel: "معدل الحضور",
accommodationsLabel: "الخدمات أو التسهيلات التعليمية",
handLabel: "تفضيل اليد",
repeatedGradesLabel: "إعادة الصفوف",
learningLabel: "تحديات في التعلم",
weekdayLabel: "روتين أيام الأسبوع",
weekendLabel: "روتين عطلة نهاية الأسبوع",
hobbiesLabel: "الهوايات والاهتمامات",
strengthsLabel: "نقاط القوة",
behaviorHeading: "الملف السلوكي",
problemBehaviorLabel: "السلوكيات الإشكالية المبلغ عنها",
behaviorObservationLabel: "ملاحظات مقدم الرعاية",
socialFunctioningLabel: "الوظائف الاجتماعية",
traumaLabel: "التعرض للصدمات",
stressorsLabel: "الضغوطات الحديثة",
behaviorNotesLabel: "ملاحظات سلوكية إضافية",
signatureHeading: "التوقيع",
caseManagerNameLabel: "اسم مدير الحالة",
caseManagerSignatureLabel: "التوقيع",
submissionDateLabel: "تاريخ الإرسال",
confirmationStatement: "تمت مراجعة هذا التقرير وتوقيعه من قبل الأخصائي المسؤول لتأكيد دقة واكتمال المعلومات المقدمة.",
childMiddleName: "اسم الأب",
childLastName: "اسم العائلة",
nationalId: "رقم الهوية الوطنية",
guardianName: "اسم الوصي",
relationshipToChild: "العلاقة بالطفل",
languageOther: "لغة أخرى",
parentMaritalStatus: "الحالة الاجتماعية",
maritalOther: "حالة اجتماعية أخرى",
household1Name: "الوصي في المنزل الأساسي",
household1Members: "أفراد المنزل (الأساسي)",
household2Name: "الوصي في المنزل الثانوي",
household2Members: "أفراد المنزل (الثانوي)",
residence1: "مدة الإقامة في المنزل الأساسي",
residence2: "مدة الإقامة في المنزل الثانوي",
siblingNames: "الأشقاء غير المقيمين في المنزل",
primaryConcerns: "المخاوف الرئيسية",
desiredOutcomes: "الأهداف المرجوة",
additionalNotes: "ملاحظات إضافية",
motherOccEdu: "وظيفة وتعليم الأم",
fatherOccEdu: "وظيفة وتعليم الأب",
numMotherPregnancies: "عدد مرات الحمل",
liveBirths: "الولادات الحية",
stillBirths: "الولادات المتوفاة",
pregnancyPlanned: "هل كان الحمل مخططًا؟",
fertilityTreatments: "علاجات الخصوبة",
tookMedicationsYesNo: "هل استُخدمت أدوية؟",
pregMedications: "الأدوية المستخدمة",
pregMedOther: "أدوية أخرى",
multipleBirthNew: "ولادة متعددة",
multipleBirthType: "نوع الولادة المتعددة",
identicalOrFraternal: "متطابقة أو غير متطابقة",
pregDrugUsed: "هل استُخدمت مواد أثناء الحمل؟",
pregDrugSpec: "المواد المستخدمة",
difficultPregYesNo: "مضاعفات الحمل؟",
pregnancyDifficulties: "مضاعفات أثناء الحمل",
pregDiffExplain: "توضيح المضاعفات",
pitocinUsedNew: "هل استُخدم البيتوثين؟",
deliveryMode: "طريقة الولادة",
csectionReasonNew: "سبب العملية القيصرية",
prematureBirthNew: "هل كانت الولادة مبكرة؟",
prematureWeeksNew: "عدد الأسابيع المبكرة",
laborDeliveryComplications: "مضاعفات أثناء الولادة",
ldComplicationsSpecify: "تحديد المضاعفات",
nicuAdmitNew: "الدخول لوحدة العناية المركزة",
nicuDischargedDays: "مدة البقاء في العناية (أيام)",
nicuReasonNew: "سبب الدخول",
problemsInHospitalYesNo: "مضاعفات حديثي الولادة",
hospitalProblems: "مشاكل في المستشفى",
currentAllergies2: "هل توجد حساسية؟",
allergiesList2: "قائمة الحساسية",
specialDiet2: "هل يتبع نظامًا غذائيًا خاصًا؟",
specialDietChecklist: "تفاصيل النظام الغذائي",
devSocial: "النمو الاجتماعي",
devCognitive: "النمو المعرفي",
devLanguage: "النمو اللغوي",
langApproxWords: "عدد الكلمات التقريبي",
devPhysical: "النمو الجسدي",
devGrooming: "مهارات النظافة",
devFeeding: "مهارات التغذية",
devDressing: "مهارات اللباس",
foodSleepReq2: "طلب الطعام أو النوم",
lossSkill2: "فقدان مهارات؟",
lossSkillExplain2: "شرح المهارات المفقودة",
lossSkillAge2: "العمر عند فقدان المهارة",
affectTraits: "السمات العاطفية",
sensVision: "البصر",
sensTactile: "اللمس",
sensHearing: "السمع",
sensTaste: "الذوق",
sensBodyAwareness: "الإدراك الجسدي",
sensSmell: "الشم",
sensVestibular: "الجهاز الدهليزي",
sensInteroception: "الإحساس الداخلي",
sensReacts: "ردود الفعل الحسية",
currentSchool: "مسجل حاليًا؟",
schoolName: "اسم المدرسة",
programGradeLevel: "البرنامج / المستوى",
attendanceFrequency: "معدل الحضور",
specialServicesAccom: "خدمات خاصة",
specialServicesType: "نوع الخدمة",
handPreference: "تفضيل اليد",
gradesRepeated: "إعادة الصفوف",
learningChallenges: "تحديات التعلم",
learningChallengesExplain: "شرح التحديات",
weekdaySchedule: "روتين أيام الأسبوع",
weekendSchedule: "روتين عطلة الأسبوع",
interestsHobbies: "الاهتمامات والهوايات",
patientStrengths: "نقاط القوة",
problemBehaviors: "السلوكيات الإشكالية",
behaviorConcerns: "مخاوف سلوكية",
friendsEasily2: "هل يُكوّن صداقات بسهولة؟",
explainFriends2: "شرح صعوبات التفاعل الاجتماعي",
socialConcerns2: "هل توجد مخاوف اجتماعية؟",
explainSocialConcerns2: "شرح المخاوف الاجتماعية",
abuseNeglectHistory: "تاريخ التعرض لصدمات",
abuseNeglectExplain: "تفاصيل الصدمة",
recentStressors2: "ضغوطات حديثة؟",
explainStressors2: "شرح الضغوطات",
behaviorAdditionalComments: "ملاحظات إضافية",
caseManager: "اسم مدير الحالة",
caseManagerSignature: "التوقيع",
intakeDate: "تاريخ الإرسال",
household1Title: "تفاصيل المنزل 1",
household2Title: "تفاصيل المنزل 2",
household1Name: "اسم الوصي في المنزل الأول",
household2Name: "اسم الوصي في المنزل الثاني",
householdMembers: "الأشخاص الآخرون في المنزل",
male: "ذكر",
female: "أنثى",
other: "آخر",
married: "متزوج",
divorced: "مطلق",
separated: "منفصل",
langArabic: "العربية",
langEnglish: "الإنجليزية",
languageExposure: "نسبة التعرض للغة غير الأساسية",
thName: "الاسم",
thSex: "الجنس",
thAge: "العمر",
thRelation: "العلاقة",
addRow: "إضافة صف",
tabDemographic: "المعلومات الديموغرافية",
tabBackground: "التاريخ المرضي",
tabObservation: "ملاحظات المراقبة",
tabGenerateADIR: "توقيع وانشاء تقرير التقييم التشخيصي للتوحد ",
assessmentGroupTitle: "التقييم الشامل",
    tabPsychological: "التقييم النفسي",
    tabOccupational: "تقييم العلاج الوظيفي",
    tabSpeech: "تقييم النطق واللغة",
    tabBehavioral: "تقييم تحليل السلوك التطبيقي",
    tabSpecialEducation: "تقييم التربية الخاصة",
    tabVocational: "تقييم المهارات المهنية",
    tabSignSubmit: "التوقيع وإنشاء التقرير الشامل",
    adirTitle: " التقييم التشخيصي للتوحد (ADIR)",
historySectionTitle: "القسم 2: التاريخ المرضي",
pregnancyTitle: "تاريخ الحمل والولادة",
motherAgeLabel: "عمر الأم البيولوجية عند الولادة",
fatherAgeLabel: "عمر الأب البيولوجي عند الولادة",
consanguinityLabel: "درجة القرابة",
firstDegree: "درجة أولى",
secondDegree: "درجة ثانية",
none: "لا",
motherEduLabel: "الوظيفة والتعليم (الأم)",
fatherEduLabel: "الوظيفة والتعليم (الأب)",
pregnancyCountLabel: "عدد مرات الحمل",
liveBirthsLabel: "الولادات الحية",
stillBirthsLabel: "الولادات المتوفاة",
pregnancyPlannedLabel: "هل كان الحمل مخططًا؟",
yes: "نعم",
no: "لا",
fertilityTreatmentsLabel: "هل تم استخدام علاجات للخصوبة؟",
unsure: "غير متأكد",
medicationsDuringPregnancy: "هل تناولت الأم أدوية أو فيتامينات أو مكملات أثناء الحمل؟",
checkAllThatApply: "(اختر كل ما ينطبق)",
vitamins: "فيتامينات",
supplements: "مكملات",
depakote: "ديباكوت (حمض الفالبرويك)",
lithium: "ليثيوم",
antidepressants: "مضادات الاكتئاب",
antiepileptics: "مضادات التشنجات",
otherMedication: "أخرى",
multipleBirth: "هل كان الطفل جزءًا من ولادة متعددة؟ (مثال: توائم)",
multipleBirthLabel: "هل كانت هناك ولادات متعددة؟",
typeLabel: "النوع:",
twins: "توأم",
triplets: "ثلاث توائم",
quadruplets: "أربعة توائم",
identical: "متطابق",
fraternal: "غير متطابق",
both: "كلاهما",
substanceUse: "هل استخدمت الأم الكحول أو التبغ أو المخدرات الترفيهية أثناء الحمل؟",
specifyIfYes: "حدد إذا كانت الإجابة نعم:",
pregnancyComplications: "هل كانت هناك صعوبات أثناء الحمل؟",
fever: "حمى",
infection: "عدوى",
spotting: "نزيف / تبقع",
miscarriage: "تهديد بالإجهاض",
highBP: "ارتفاع ضغط الدم",
diabetes: "سكري الحمل",
rh: "عدم توافق RH",
stress: "توتر شديد",
accidents: "حوادث",
explainComplications: "إذا كانت هناك إجابة نعم، يرجى الشرح:",
laborDeliveryTitle: "الولادة والمخاض",
pitocinLabel: "هل تم استخدام البيتوثين لتحفيز أو تسريع الولادة؟",
prematureBirthLabel: "هل وُلد الطفل قبل موعده؟",
prematureWeeks: "إذا نعم، كم عدد الأسابيع؟",
laborComplications: "هل كانت هناك مضاعفات أثناء الولادة؟",
hospitalProblemsLabel: "هل واجه الطفل مشاكل أثناء وجوده في المستشفى؟",
nicuLabel: "هل تم إدخال الطفل إلى وحدة العناية المركزة (NICU)؟",
nicuDays: "إذا نعم، كم كان عمره عند الخروج (بالأيام)؟",
nicuReason: "لماذا تم إدخاله إلى العناية المركزة؟",
deliveryModeLabel: "كانت الولادة:",
deliveryComplicationsLabel: "هل كانت هناك مضاعفات أثناء المخاض أو الولادة؟",
vaginal: "طبيعية",
csection: "قيصرية",
breech: "ولادة مقعدية",
forceps: "استخدام الملقط",
cordAround: "الحبل السري حول الرقبة",
feedingDiff: "صعوبات في التغذية",
hospitalInfection: "عدوى",
sleepingProblems: "مشاكل في النوم",
jaundice: "يرقان",
birthDefects: "عيوب خلقية",
seizures: "نوبات",
unconscious: "فقدان للوعي",
excessCry: "بكاء مفرط",
gi: "أعراض الجهاز الهضمي (إسهال، إمساك، غثيان، تقيؤ، ارتجاع)",
dietCamsTitle: "النظام الغذائي والعلاجات التكميلية",
hasAllergies: "هل لدى الطفل أي حساسية حالية؟",
onSpecialDiet: "هل يتبع الطفل نظامًا غذائيًا خاصًا؟",
ifYesDietLabel: "إذا كانت الإجابة نعم، يرجى التحديد أدناه:",
glutenFree: "نظام غذائي خالٍ من الجلوتين",
caseinFree: "نظام غذائي خالٍ من الكازين",
noSugar: "بدون سكريات مصنّعة",
noSalicylates: "بدون سكريات أو ساليسيلات",
feingoldDiet: "نظام فاينغولد الغذائي",
otherDiet: "أخرى",
devHistoryTitle: "التاريخ النمائي",
devInstructions: "(حدد جميع المهارات المحققة )",
socialHeading: "اجتماعي / عاطفي:",
socSmile: "يبتسم",
socLookFace: "ينظر إلى وجهك",
socLaughs: "يضحك",
socKnowsFamily: "يعرف أفراد الأسرة",
socShy: "خجول",
socFearful: "خائف",
socRespondName: "يستجيب لاسمه",
socPlayGames: "يلعب ألعابًا",
socClapping: "يصفق عند الفرح",
socAffection: "يُظهر المودة",
socNoticesEmotion: "يلاحظ مشاعر الآخرين",
socPlayNext: "يلعب بجوار أطفال آخرين",
socFollowRoutine: "يتبع روتينًا بسيطًا",
languageHeading: "اللغة / التواصل:",
langBabbling: "ثرثرة (Babbling)",
langCooing: "أصوات ناعمة (Cooing)",
langPointing: "يشير",
langTwoSounds: "صوتين (مثل ماماما)",
langFirstWord: "أول كلمة",
langNamesObjects: "يسمي الأشياء",
lang2_3Words: "2-3 كلمات",
langTurnTaking: "دور متبادل (Turn-taking)",
lang3PlusWords: "أكثر من 3 كلمات",
langPointsItems: "يشير إلى الأشياء عند سؤاله (أين __؟)",
langUsesGestures: "يستخدم الإيماءات",
langConversation: "محادثة",
langWhQuestions: "يطرح أسئلة WH",
langSaysName: "يقول اسمه الأول",
langTellsStory: "يروي قصة",
langUseAAC: "يستخدم AAC",
langApprox: "عدد الكلمات التقريبي (إن وجد):",
cognitiveHeading: "المعرفي:",
cogLookToys: "ينظر إلى الألعاب",
cogMouth: "يضع الأشياء في فمه",
cogMissing: "يبحث عن الأشياء المفقودة",
cogStacks: "يرتب الأشياء فوق بعضها",
cogCopies: "يقلد البالغين",
cog1Step: "يتبع توجيهات من خطوة واحدة",
cogSimplePlay: "يلعب بالألعاب بطرق بسيطة",
cogTwoHands: "يستخدم كلتا اليدين في نفس الوقت",
cogPretend: "لعب تمثيلي",
cogProblem: "حل المشكلات",
cogColors: "يعرف الألوان",
cog2Step: "يتبع توجيهات من خطوتين",
cogImitation: "التقليد",
cogDanger: "يتعرف على الخطر",
cogAvoid: "يتجنب الخطر",
physicalHeading: "الحركي / البدني:",
phyRoll: "يتدحرج",
phySitUp: "يجلس",
phyCrawl: "يزحف",
phyWalk: "يمشي",
phyJump: "يقفز",
phyStair: "يصعد السلالم",
phyTricycle: "يستخدم دراجة ثلاثية العجلات",
phyPencil: "يمسك القلم",
phyScribble: "يخربش",
phyKick: "يركل الكرة",
phyCatch: "يمسك الكرة",
dailyLivingHeading: "مهارات الحياة اليومية:",
groomingHeading: "العناية الشخصية / النظافة:",
toileting: "استخدام الحمام",
brushHair: "تمشيط الشعر",
brushTeeth: "تنظيف الأسنان",
washHands: "غسل اليدين",
washFace: "غسل الوجه",
bathing: "الاستحمام",
feedingHeading: "التغذية:",
useUtensils: "استخدام أدوات المائدة",
drinkCup: "الشرب من كوب / شفاط",
feedFingers: "يستخدم الأصابع للتغذية",
servesFood: "يُقدم الطعام",
messyEater: "يأكل بطريقة غير مرتبة",
pickyEater: "انتقائي / صعب الإرضاء",
dressingHeading: "ارتداء الملابس:",
buttonClothes: "زرّ الملابس",
zipsClothes: "سوستة الملابس",
offShoes: "ينزع الحذاء / الجوارب",
tieShoes: "يربط الحذاء",
offClothes: "ينزع الملابس",
foodSleepLabel: "كيف يطلب الطفل الطعام؟ أو النوم؟",
regressionLabel: "هل فقد الطفل مهارة مكتسبة سابقًا أو تراجع فيها؟",
lossSkillAge: "في أي عمر لاحظت فقدان المهارة؟",
sensoryHeading: "الاندماج / التنظيم الحسي",
affectLabel: "صف الحالة العامة للطفل، مستوى النشاط، والانتباه (اختر كل ما ينطبق):",
affectQuiet: "هادئ غالبًا",
affectActive: "نشط بشكل مفرط",
affectTires: "يتعب بسهولة",
affectTalkative: "كثير الكلام",
affectImpulsive: "مندفع",
affectResistant: "يرفض التغيير",
affectClumsy: "غير متوازن / غير دقيق",
affectNervous: "عادات عصبية",
affectStubborn: "عنيد",
affectHappy: "سعيد",
affectSeparation: "صعوبة في الانفصال عن مقدم الرعاية",
domainSensoryLabel: "هل هناك مخاوف في أي من المجالات التالية؟",
reactionsLabel: "ردود الفعل على هذه الحساسيات (اختر كل ما ينطبق):",
sensCrying: "بكاء",
sensRunning: "الهروب / الركض",
sensEars: "يضع يديه على أذنيه",
normal: "طبيعي",
high: "مرتفع",
low: "منخفض",
sensVisionLabel: "البصر (وميض الأضواء، الدوران)",
sensTactileLabel: "اللمس (الحلاقة، الأظافر، القوام)",
sensHearingLabel: "السمع (المكنسة الكهربائية، تدفق المرحاض)",
sensTasteLabel: "الذوق (الفم)",
sensBodyLabel: "الوعي الجسدي (تحمل الألم، القفز، الجري)",
sensSmellLabel: "الشم (يشم الأشياء / الأشخاص)",
sensVestibularLabel: "الدهليزي (الدوران، التوازن، السقوط)",
sensInteroceptionLabel: "الإحساس الداخلي (الجوع، الإمساك)",
educationHeading: "التاريخ التعليمي",
schoolLabel: "هل الطفل مسجل حاليًا في المدرسة؟",
gradeLabel: "البرنامج أو المستوى الدراسي:",
attendanceLabel: "كم مرة يحضر الطفل إلى المدرسة؟",
accommodationsLabel: "هل يتلقى الطفل خدمات خاصة أو تسهيلات في المدرسة؟",
handLabel: "تفضيل اليد:",
repeatedGradesLabel: "هل تم تكرار أي صفوف دراسية؟",
learningLabel: "هل يواجه الطفل تحديات في القراءة أو الرياضيات أو الكتابة؟",
weekdayLabel: "اليوم النموذجي: صف جدول الطفل خلال أيام الأسبوع وعطلة نهاية الأسبوع",
hobbiesLabel: "ما هي اهتمامات وهوايات الطفل؟",
strengthsLabel: "ما هي نقاط قوة الطفل؟",
right: "أيمن",
left: "أعسر",
behaviorHeading: "السلوكيات الإشكالية",
behaviorAreasLabel: "هل هناك مخاوف تتعلق بأي من المجالات التالية؟",
pbAggression: "العدوان تجاه الآخرين",
pbSelfInjury: "السلوك المؤذي للذات",
pbTransitions: "صعوبة في التنقل بين الأنشطة",
pbInappropriateConv: "محادثة غير لائقة",
pbInappropriateBehavior: "سلوك غير لائق",
pbRitualistic: "سلوك طقوسي",
pbRepetitive: "سلوك متكرر",
pbFixations: "هوس (برامج، أرقام، أشياء)",
behaviorDescribe: "يرجى وصف أي مخاوف سلوكية حالية:",
friendsLabel: "هل يُكون الطفل صداقات بسهولة؟",
socialLabel: "هل هناك مخاوف تتعلق بالمهارات أو الاهتمامات الاجتماعية؟",
abuseLabel: "هل تعرض الطفل لأي نوع من الإساءة أو الإهمال أو العنف الأسري؟",
stressLabel: "هل واجه الطفل مؤخرًا ضغوطًا كبيرة (مثل انتقال أو فقدان)؟",
behaviorNotesLabel: "ملاحظات إضافية:",
medicalHistoryHeading: "التاريخ الطبي والتقييمات",
medicalPrompt: "يرجى تحديد ما إذا كانت كل من الحالات/الأعراض التالية تمثل مشكلة صحية حالية أو سابقة:",
yes: "نعم",
no: "لا",
unsure: "غير متأكد",
condSleep: "النوم",
condBlood: "الدم / فقر الدم",
condVision: "البصر",
condSkin: "مشاكل الجلد",
condHearing: "السمع",
condEndocrine: "الغدد الصماء / الهرمونات",
condDental: "الأسنان",
condSeizures: "النوبات",
condHeart: "القلب",
condHeadInjury: "إصابة الرأس",
condAsthma: "الربو",
condFailureThrive: "فشل في النمو",
condNausea: "الغثيان / التقيؤ",
condFeeding: "التغذية",
evalPrompt: "٢. هل خضع الطفل لأي من التقييمات التالية؟ إذا كانت الإجابة نعم، يُرجى إرفاق المستندات الداعمة",
evalHeader: "التقييمات",
yesNoUnsure: "نعم / لا / غير متأكد",
normalAbnormal: "طبيعي / غير طبيعي",
evalAudiological: "تقييم سمعي",
evalVision: "تقييم البصر",
evalHeadImaging: "تصوير الرأس (الرنين، الأشعة المقطعية، الموجات فوق الصوتية)",
evalGenetic: "اختبار وراثي",
evalEEG: "تخطيط الدماغ (EEG)",
evalPsych: "تقييم نفسي (مثل اختبار الذكاء)",
evalOther: "تقييمات أو إجراءات أخرى:",
evalAbnormalExplain: "إذا كان أي من التقييمات أعلاه غير طبيعي، يرجى التوضيح:",
normal: "طبيعي",
abnormal: "غير طبيعي",
diagnosisPrompt: "٣. يرجى تحديد ما إذا تم تشخيص طفلك أو يُشتبه بإصابته بأي من الحالات التالية:",
conditionLabel: "الاضطراب / الحالة",
diagnosisStatus: "الحالة (تم التشخيص / مشتبه به / أبداً)",
diagnosisReport: "التقرير",
diagnosed: "تم التشخيص",
suspected: "مشتبه به",
never: "أبداً",
condDown: "متلازمة داون",
condADHD: "اضطراب فرط الحركة وتشتت الانتباه (ADHD) / ADD",
condASD: "اضطراب طيف التوحد (ASD)",
condDD: "تأخر نمو / إعاقة ذهنية",
condOther: "أخرى",
biomedPrompt: "٤. يرجى ذكر أي تدخلات طبية حيوية أخرى:",
biomedMedication: "الدواء",
biomedDosage: "الجرعة / الوقت",
biomedDuration: "المدة",
biomedComments: "ملاحظات",
addRowBtn: "إضافة صف",
therapyPrompt: "٥. هل تم عرض الطفل على أخصائي علاج وظيفي أو نُطق ولغة أو طبيب نفسي أو أخصائي نفسي أو مستشار صحي نفسي؟",
ifYesTherapyInfo: "إذا كانت الإجابة نعم، يرجى تقديم المعلومات التالية:",
therapyType: "نوع العلاج الحالي",
agencyTherapist: "الجهة / المعالج",
duration: "المدة",
evalAvailable: "هل تتوفر تقارير للتقييم؟",
improvements: "هل حدثت تحسينات؟",
therapyOT: "العلاج الوظيفي",
therapyPT: "العلاج الطبيعي",
therapySLP: "علاج النُطق / اللغة",
therapyPsych: "العلاج النفسي",
therapyABA: "العلاج السلوكي",
therapyOther: "أخرى:",
additionalNotes: "ملاحظات إضافية:",
obsHeader: "ملاحظات الملاحظة",
obsSection1: "١. المظهر العام والسلوك",
obsGroomed: "هل الطفل مهندم ويرتدي ملابس مناسبة؟",
obsFacial: "هل تعبير وجه الطفل طبيعي أو محايد؟",
obsActivity: "هل يبدو مستوى نشاط الطفل مناسبًا لعمره؟",
obsTransitions: "هل يتعامل الطفل بهدوء مع الانتقالات (دون انزعاج كبير)؟",
obsSection2: "٢. التفاعل مع الوالد/الوصي",
obsAttachment: "هل يُظهر الطفل ارتباطًا آمنًا / يسعى إلى الاقتراب من والده؟",
obsSeparation: "هل يظهر الطفل قلق الانفصال عند مغادرة الوالد؟",
obsCompliance: "هل يمتثل الطفل عمومًا لتعليمات أو توجيهات الوالد؟",
obsSection3: "٣. التفاعل الاجتماعي مع الأخصائي",
obsInitiation: "هل يبدأ الطفل التفاعل الاجتماعي (كلام، إيماءات) مع الأخصائي؟",
yes: "نعم",
no: "لا",
obsEyeContact: "هل يتواصل الطفل بصريًا بشكل تلقائي؟",
obsSharedAttention: "هل يشارك الطفل في المتعة أو يوجّه الانتباه المشترك مع الأخصائي؟",
obsSection4: "٤. التواصل واللغة",
obsVerbal: "هل يستخدم الطفل التواصل اللفظي (عبارات، جمل) تلقائيًا؟",
obsEcholalia: "هل يعرض الطفل التكرار الصوتي أو أنماط كلام مكررة؟",
obsNonverbal: "هل يستخدم الطفل وسائل غير لفظية للتواصل (إيماءات، إشارات، PECS) بفعالية؟",
obsSection5: "٥. المهارات الحركية والحركة",
obsFlapping: "هل لوحظ أي رفرفة باليد أو سلوك متكرر (stimming)؟",
obsTiptoe: "هل يمشي الطفل أو يركض على أطراف أصابعه؟",
obsFineMotor: "هل المهارات الحركية الدقيقة مناسبة للعمر؟ (مثل التقاط أشياء صغيرة، الرسم)",
obsSection6: "٦. التنظيم الانفعالي والمزاج",
obsMood: "هل يبدو الطفل هادئًا / مرتاحًا معظم وقت الجلسة؟",
obsFrustration: "هل يتحمل الطفل الإحباطات الطفيفة دون نوبات غضب كبيرة؟",
obsCalming: "هل ينظم الطفل نفسه أو يهدأ بسرعة بدعم بسيط؟",
obsSection7: "٧. اللعب والتفاعل",
obsImaginativePlay: "هل يشارك الطفل في اللعب التخيلي أو التمثيلي؟",
obsConstructivePlay: "هل يستمتع الطفل باللعب البنّاء (مثل البازل أو المكعبات)؟",
obsRepetitivePlay: "هل يُظهر الطفل أنماطًا متكررة أو متعلقة في اللعب؟",
obsSection8: "٨. الاستجابات الحسية",
obsNoise: "هل يتفاعل الطفل بقوة مع الأصوات العالية أو المفاجئة؟",
obsTouch: "هل يتجنب الطفل أو يسعى وراء مدخلات حسية معينة؟",
obsVisual: "هل ينجذب الطفل أو ينزعج من الأجسام الدوارة أو الأضواء؟",
obsSection9: "٩. السلوكيات المتكررة والطقوس والجمود",
obsRoutines: "هل يلتزم الطفل بشدة بالروتين ويظهر انزعاجًا عند تغييره؟",
obsFixations: "هل يُظهر الطفل ارتباطًا أو تركيزًا على برامج، أشياء، أو أرقام معينة؟",
obsSection10: "١٠. التعاون والانتباه",
obsCompliance: "هل يتبع الطفل التعليمات بشكل عام؟",
obsAttention: "هل يحافظ الطفل على انتباهه في المهام أم يتشتت بسهولة؟",
obsSection11: "١١. نقاط القوة الملحوظة",
obsStrengthsPlaceholder: "صف أي مهارات أو سلوكيات إيجابية...",
obsSection12: "١٢. المخاوف / ملاحظات إضافية",
obsConcernsPlaceholder: "صف أي سلوكيات مثيرة للقلق بشكل خاص...",
signSubmitHeading: "توقيع وإرسال تقرير التقييم التشخيصي للتوحد",
caseManagerNameLabel: "اسم مشرف الحالة",
caseManagerSignatureLabel: "توقيع مشرف الحالة",
submissionDateLabel: "التاريخ",
generateAI: "إنشاء قائمة تقرير التقييم التشخيصي للتوحد (ADIR)",
generateListReport: "إنشاء قائمة تقرير التقييم التشخيصي للتوحد (ADIR) - ",
csectionReasonPlaceholder: "سبب الولادة القيصرية",
milestoneOnTime: "نعم، في الوقت المناسب",
milestoneDelayed: "نعم، ولكن مع تأخر",
milestoneNotAchieved: "لم يتحقق",
soc_smile: "يبتسم",
soc_lookFace: "ينظر إلى وجهك",
soc_laughs: "يضحك",
soc_knowsFamily: "يتعرف على أفراد العائلة",
soc_shy: "خجول",
soc_fearful: "خائف",
soc_respondName: "يستجيب لاسمه",
soc_playGames: "يلعب الألعاب",
soc_clapping: "يصفق عند الفرح",
soc_showsAffection: "يبدي مشاعر المودة",
soc_noticesEmotion: "يلاحظ مشاعر الآخرين",
soc_playNext: "يلعب بجانب أطفال آخرين",
soc_followRoutine: "يتبع الروتين البسيط",
cogLookToys: "ينظر إلى الألعاب",
cogMouth: "يضع الأشياء في الفم",
cogMissing: "يبحث عن الأشياء المفقودة",
cogStacks: "يرتب الأشياء",
cogCopies: "يقلد البالغين",
cog1Step: "يتبع تعليمات من خطوة واحدة",
cogSimplePlay: "يلعب بالألعاب بطرق بسيطة",
cogTwoHands: "يستخدم كلتا اليدين في وقت واحد",
cogPretend: "يلعب بشكل تخيلي",
cogProblem: "يحل المشكلات",
cogColors: "يعرف الألوان",
cog2Step: "يتبع تعليمات من خطوتين",
cogImitation: "يقلد الآخرين",
cogDanger: "يتعرف على الخطر",
cogAvoid: "يتجنب الخطر",
langBabbling: "ثرثرة (Babbling)",
langCooing: "أصوات ناعمة (Cooing)",
langPointing: "يشير",
langTwoSounds: "صوتين (مثل ماماما)",
langFirstWord: "أول كلمة",
langNamesObjects: "يسمي الأشياء",
lang2_3Words: "2-3 كلمات",
langTurnTaking: "دور متبادل (Turn-taking)",
lang3PlusWords: "أكثر من 3 كلمات",
langPointsItems: "يشير إلى الأشياء عند سؤاله (أين __؟)",
langUsesGestures: "يستخدم الإيماءات",
langConversation: "محادثة",
langWhQuestions: "يطرح أسئلة WH",
langSaysName: "يقول اسمه الأول",
langTellsStory: "يروي قصة",
langUseAAC: "يستخدم AAC",
phyRoll: "يتدحرج",
phySitUp: "يجلس",
phyCrawl: "يزحف",
phyWalk: "يمشي",
phyJump: "يقفز",
phyStair: "يصعد الدرج",
phyTricycle: "يستخدم دراجة ثلاثية",
phyPencil: "يمسك بالقلم",
phyScribble: "يخربش",
phyKick: "يركل الكرة",
phyCatch: "يمسك الكرة",
toileting: "استخدام الحمام",
brushHair: "تمشيط الشعر",
brushTeeth: "تنظيف الأسنان",
washHands: "غسل اليدين",
washFace: "غسل الوجه",
bathing: "الاستحمام",

useUtensils: "استخدام أدوات المائدة",
drinkCup: "الشرب من الكوب / الشفاط",
feedFingers: "يتغذى بالأصابع",
servesFood: "يُقدم الطعام",
messyEater: "يأكل بشكل غير مرتب",
pickyEater: "صعب الإرضاء / انتقائي",

buttonClothes: "زر الملابس",
zipsClothes: "سحّاب الملابس",
offShoes: "ينزع الأحذية / الجوارب",
tieShoes: "يربط الحذاء",
offClothes: "ينزع الملابس",
milestoneLabel: "المهارة",
aiReportListTitle: "قائمة تقرير التقييم التشخيصي للتوحد (ADIR) المُولدة بواسطة الذكاء الاصطناعي",
generateListReport: "إنشاء قائمة تقرير التقييم التشخيصي للتوحد (ADIR)",
csectionReasonLabel: "سبب العملية القيصرية"

  }
};
function switchLanguage(lang) {
  // clamp to a supported dictionary
  currentLanguage = translations[lang] ? lang : "en";
  const t = translations[currentLanguage];

  // direction only for Arabic
  document.body.dir = currentLanguage === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("rtl", currentLanguage === "ar");

  // buttons
  const signBtn = document.querySelector('button[onclick="generateFullIntakeReport()"]');
  if (signBtn) signBtn.textContent = t.signSubmit;

  const aiBtn = document.querySelector('button[onclick="generateNarrativeReport()"]');
  if (aiBtn) aiBtn.textContent = t.generateAI;

  const langLabel = document.querySelector('label[for="languageSelect"]');
  if (langLabel) langLabel.textContent = t.selectLanguage;

  // labels with data-translate
  document.querySelectorAll("[data-translate]").forEach((el) => {
    const key = el.getAttribute("data-translate");
    if (t[key]) el.textContent = t[key];
  });

  // option elements
  document.querySelectorAll("option[data-translate-option]").forEach((opt) => {
    const key = opt.getAttribute("data-translate-option");
    if (t[key]) {
      opt.textContent = t[key];
      opt.label = t[key];
    }
  });
}



// ========== Step 1: Intake Report Generation ==========

function generateFullIntakeReport() {
  const container = document.getElementById("intakeReportContainer");
  if (!container) {
    alert("Report container not found!");
    return;
  }
  container.style.display = "block";  // ✅ make it visible
  let doc = "";


  const get = (id) => document.getElementById(id)?.value.trim() || "";
  const today = new Date().toLocaleDateString();
const t = translations[currentLanguage] || translations.en;
  const childFullName = `${get("firstName")} ${get("middleName")} ${get("lastName")}`.trim();
  const preferredName = get("preferredName");
  const dob = get("dobGregorian");
  const age = get("age");
  const gender = get("gender") === "other" ? get("genderOtherField") : get("gender");
  const intakeDate = get("caseManagerSignDate");
  const caseManager = get("caseManagerName");
  const reportDate = today;

  // Additional extracted fields for demographic and background narrative
  const primaryLanguage = get("primaryLanguage");
  const languageOther = get("languageOtherField");
  const secondaryLanguages = get("secondaryLanguages");
  const languageExposure = get("languageExposure");
  const parentMaritalStatus = get("parentMaritalStatus");
  const maritalOther = get("maritalOtherField");
  const household1Name = get("household1");
const residence1 = get("residence1");
const household2Name = get("household2");
const residence2 = get("residence2");

const household1Names = Array.from(document.getElementsByName("household1_name[]")).map(el => el.value.trim()).filter(v => v);
const household1Ages = Array.from(document.getElementsByName("household1_age[]")).map(el => el.value.trim()).filter(v => v);
const household1Relations = Array.from(document.getElementsByName("household1_relation[]")).map(el => el.value.trim()).filter(v => v);

const household2Names = Array.from(document.getElementsByName("household2_name[]")).map(el => el.value.trim()).filter(v => v);
const household2Ages = Array.from(document.getElementsByName("household2_age[]")).map(el => el.value.trim()).filter(v => v);
const household2Relations = Array.from(document.getElementsByName("household2_relation[]")).map(el => el.value.trim()).filter(v => v);

const siblingNames = Array.from(document.getElementsByName("additionalSiblings_name[]")).map(el => el.value.trim()).filter(v => v);
const siblingAges = Array.from(document.getElementsByName("additionalSiblings_age[]")).map(el => el.value.trim()).filter(v => v);
  const extendedFamilyInvolvement = get("extendedFamilyInvolvement");
  const primaryConcerns = get("primaryConcerns");
  const desiredOutcomes = get("desiredOutcomes");
  const additionalNotes = get("additionalNotes");
  // ========== PREGNANCY & BIRTH HISTORY ==========
const motherAgeAtBirth = get("motherAgeAtBirthNew");
const fatherAgeAtBirth = get("fatherAgeAtBirthNew");
const degreeOfConsanguinity = get("degreeOfConsanguinity");
const motherOccEdu = get("motherOccEdu");
const fatherOccEdu = get("fatherOccEdu");
const numMotherPregnancies = get("numMotherPregnanciesNew");
const liveBirths = get("liveBirthsNew");
const stillBirths = get("birthDied");
const pregnancyPlanned = get("pregnancyPlannedNew");
const fertilityTreatments = get("fertilityTreatmentsNew");
const tookMedicationsYesNo = get("tookMedicationsYesNo");
const pregMedications = [
  "pregMed_vitamins", "pregMed_supplements", "pregMed_depakote",
  "pregMed_lithium", "pregMed_antidepressants", "pregMed_antiepileptics"
].filter(id => document.getElementsByName(id)[0]?.checked).map(id => id.replace("pregMed_", ""));
const pregMedOther = get("pregMed_otherText");
const multipleBirthNew = get("multipleBirthNew");
const multipleBirthType = get("multipleBirthType");
const identicalOrFraternal = get("identicalOrFraternal");
const pregDrugUsed = get("pregDrugUsed");
const pregDrugSpec = get("pregDrugSpec");
const difficultPregYesNo = get("difficultPregYesNo");
const pregnancyDifficulties = [
  "pregDiff_fever", "pregDiff_infection", "pregDiff_spotting", "pregDiff_threatMiscarriage",
  "pregDiff_highBP", "pregDiff_gestDiabetes", "pregDiff_rhIncompat", "pregDiff_stress", "pregDiff_accidents"
].filter(id => document.getElementsByName(id)[0]?.checked).map(id => id.replace("pregDiff_", ""));
const pregDiffExplain = get("pregDiff_explain");

// ========== LABOR & DELIVERY ==========
const pitocinUsedNew = get("pitocinUsedNew");
const prematureBirthNew = get("prematureBirthNew");
const prematureWeeksNew = get("prematureWeeksNew");
const laborDeliveryComplications = get("laborDeliveryComplications");
const ldComplicationsSpecify = get("ldComplicationsSpecify");
const problemsInHospitalYesNo = get("problemsInHospitalYesNo");
const hospitalProblems = [
  "hospitalProb_feeding", "hospitalProb_infections", "hospitalProb_sleeping",
  "hospitalProb_jaundice", "hospitalProb_birthdefects", "hospitalProb_seizures",
  "hospitalProb_unconscious", "hospitalProb_excessCry", "hospitalProb_gi"
].filter(id => document.getElementsByName(id)[0]?.checked).map(id => id.replace("hospitalProb_", ""));
const nicuAdmitNew = get("nicuAdmitNew");
const nicuDischargedDays = get("nicuDischargedDays");
const nicuReasonNew = get("nicuReasonNew");
const deliveryMode = get("deliveryMode");
const deliveryModeOtherText = get("deliveryModeOtherText");
const csectionReasonNew = get("csectionReasonNew");

const laborComplicationsList = [
  "complication_breech", "complication_forceps", "complication_cord", "complication_other"
].filter(id => document.getElementsByName(id)[0]?.checked).map(id => id.replace("complication_", ""));

const complicationOtherText = get("complication_otherText");

// ========== DIET AND CAMS ==========
const currentAllergies2 = get("currentAllergies2");
const allergiesList2 = get("allergiesList2");
const specialDiet2 = get("specialDiet2");
const specialDietChecklist = [
  "diet_glutenFree2", "diet_caseinFree2", "diet_noSugar",
  "diet_noSalicylates", "diet_feingold", "diet_other2"
].filter(id => document.getElementsByName(id)[0]?.checked).map(id => id.replace("diet_", ""));
// ========== DEVELOPMENTAL HISTORY ==========
const foodSleepReq2 = get("foodSleepReq2");
const lossSkill2 = get("lossSkill2");
const lossSkillExplain2 = get("lossSkillExplain2");
const lossSkillAge2 = get("lossSkillAge2");

const devSocial = {
  smile: getRadioValue("soc_smile"),
  lookFace: getRadioValue("soc_lookFace"),
  laughs: getRadioValue("soc_laughs"),
  knowsFamily: getRadioValue("soc_knowsFamily"),
  shy: getRadioValue("soc_shy"),
  fearful: getRadioValue("soc_fearful"),
  respondName: getRadioValue("soc_respondName"),
  playGames: getRadioValue("soc_playGames"),
  clapping: getRadioValue("soc_clapping"),
  showsAffection: getRadioValue("soc_showsAffection"),
  noticesEmotion: getRadioValue("soc_noticesEmotion"),
  playNext: getRadioValue("soc_playNext"),
  followRoutine: getRadioValue("soc_followRoutine")
};

const devCognitive = {
  lookToys: getRadioValue("cog_lookToys"),
  putThingsMouth: getRadioValue("cog_putThingsMouth"),
  lookMissing: getRadioValue("cog_lookMissing"),
  stacks: getRadioValue("cog_stacks"),
  copiesAdults: getRadioValue("cog_copiesAdults"),
  follow1step: getRadioValue("cog_follow1step"),
  playsSimpleWays: getRadioValue("cog_playsSimpleWays"),
  twoHands: getRadioValue("cog_twoHands"),
  pretendPlay: getRadioValue("cog_pretendPlay"),
  problemSolving: getRadioValue("cog_problemSolving"),
  knowsColors: getRadioValue("cog_knowsColors"),
  follow2step: getRadioValue("cog_follow2step"),
  imitation: getRadioValue("cog_imitation"),
  recognizeDanger: getRadioValue("cog_recognizeDanger"),
  avoidDanger: getRadioValue("cog_avoidDanger")
};


const devLanguage = {
  babbling: getRadioValue("lang_babbling"),
  cooing: getRadioValue("lang_cooing"),
  pointing: getRadioValue("lang_pointing"),
  twoSounds: getRadioValue("lang_twoSounds"),
  firstWord: getRadioValue("lang_firstWord"),
  namesObjects: getRadioValue("lang_namesObjects"),
  twoThreeWords: getRadioValue("lang_2_3words"),
  turnTaking: getRadioValue("lang_turnTaking"),
  threePlusWords: getRadioValue("lang_3plusWords"),
  pointsItems: getRadioValue("lang_pointsItems"),
  usesGestures: getRadioValue("lang_usesGestures"),
  conversation: getRadioValue("lang_conversation"),
  whQuestions: getRadioValue("lang_whQuestions"),
  saysName: getRadioValue("lang_saysName"),
  tellsStory: getRadioValue("lang_tellsStory"),
  useAAC: getRadioValue("lang_useAAC")
};
const langApproxWords = get("lang_approxWords");

const devPhysical = {
  roll: getRadioValue("phy_roll"),
  sitUp: getRadioValue("phy_sitUp"),
  crawl: getRadioValue("phy_crawl"),
  walk: getRadioValue("phy_walk"),
  jump: getRadioValue("phy_jump"),
  staircase: getRadioValue("phy_staircase"),
  tricycle: getRadioValue("phy_tricycle"),
  holdsPencil: getRadioValue("phy_holdsPencil"),
  scribble: getRadioValue("phy_scribble"),
  kickBall: getRadioValue("phy_kickBall"),
  catchBall: getRadioValue("phy_catchBall")
};

const devGrooming = {
  toileting: getRadioValue("groom_toileting"),
  brushHair: getRadioValue("groom_brushHair"),
  brushTeeth: getRadioValue("groom_brushTeeth"),
  washHands: getRadioValue("groom_washHands"),
  washFace: getRadioValue("groom_washFace"),
  bathing: getRadioValue("groom_bathing")
};

const devFeeding = {
  useUtensils: getRadioValue("feed_useUtensils"),
  drinkCup: getRadioValue("feed_drinkCup"),
  fingers: getRadioValue("feed_fingers"),
  servesFood: getRadioValue("feed_servesFood"),
  messy: getRadioValue("feed_messy"),
  picky: getRadioValue("feed_picky")
};

const devDressing = {
  buttonClothes: getRadioValue("dress_buttonClothes"),
  zips: getRadioValue("dress_zips"),
  offShoes: getRadioValue("dress_offShoes"),
  tieShoelaces: getRadioValue("dress_tieShoelaces"),
  takeOffClothes: getRadioValue("dress_takeOffClothes")
};

// ========== SENSORY INTEGRATION / REGULATION ==========
const affectTraits = [
  "affect_quiet", "affect_active", "affect_tiresEasily", "affect_talkative",
  "affect_impulsive", "affect_resistantChange", "affect_clumsy",
  "affect_nervousHabits", "affect_stubborn", "affect_happy", "affect_diffSeparation"
].filter(id => document.getElementsByName(id)[0]?.checked).map(id => id.replace("affect_", ""));

const sensVision = get("sensVision");
const sensTactile = get("sensTactile");
const sensHearing = get("sensHearing");
const sensTaste = get("sensTaste");
const sensBodyAwareness = get("sensBodyAwareness");
const sensSmell = get("sensSmell");
const sensVestibular = get("sensVestibular");
const sensInteroception = get("sensInteroception");

const sensReacts = [
  "sensReacts_crying", "sensReacts_running", "sensReacts_handsOverEars"
].filter(id => document.getElementsByName(id)[0]?.checked).map(id => id.replace("sensReacts_", ""));

// ========== EDUCATIONAL HISTORY ==========
const currentSchool = get("currentSchool");
const schoolName = get("schoolName");
const programGradeLevel = get("programGradeLevel");
const attendanceFrequency = get("attendanceFrequency");
const specialServicesAccom = get("specialServicesAccom");
const specialServicesType = get("specialServicesType");
const handPreference = get("handPreference") || get("handPreferenceAlt");
const gradesRepeated = get("gradesRepeated");
const learningChallenges = get("learningChallenges");
const learningChallengesExplain = get("learningChallengesExplain");
const weekdaySchedule = get("weekdaySchedule");
const weekendSchedule = get("weekendSchedule");
const interestsHobbies = get("interestsHobbies");
const patientStrengths = get("patientStrengths");
// ========== PROBLEM BEHAVIOR(S) ==========
const problemBehaviors = [
  "pb_aggression",
  "pb_selfInjury",
  "pb_difficultyTransitions",
  "pb_inappropriateConv",
  "pb_inappropriateBehavior",
  "pb_ritualistic",
  "pb_repetitive",
  "pb_fixations"
].filter(id => document.getElementsByName(id)[0]?.checked).map(id => id.replace("pb_", ""));

const behaviorConcerns = get("behaviorConcerns");
const friendsEasily2 = get("friendsEasily2");
const explainFriends2 = get("explainFriends2");
const socialConcerns2 = get("socialConcerns2");
const explainSocialConcerns2 = get("explainSocialConcerns2");
const abuseNeglectHistory = get("abuseNeglectHistory");
const abuseNeglectExplain = get("abuseNeglectExplain");
const recentStressors2 = get("recentStressors2");
const explainStressors2 = get("explainStressors2");
const behaviorAdditionalComments = get("behaviorAdditionalComments");
// ========== MEDICAL HISTORY ==========
const medicalConditions = [
  "sleep", "blood", "vision", "skin", "hearing", "endocrine",
  "dental", "seizures", "heart", "headInjury", "asthma",
  "failureThrive", "nausea", "feeding"
].map(condition => {
  const yes = document.getElementsByName(`cond_${condition}_yes`)[0]?.checked;
  const no = document.getElementsByName(`cond_${condition}_no`)[0]?.checked;
  const unsure = document.getElementsByName(`cond_${condition}_unsure`)[0]?.checked;
  return {
    condition,
    status: yes ? "yes" : no ? "no" : unsure ? "unsure" : "unspecified"
  };
});
const evaluations = [
  "audiological", "vision", "headImaging", "genetic", "eeg", "psych"
].map(type => {
  const yes = document.getElementsByName(`eval_${type}_yes`)[0]?.checked;
  const no = document.getElementsByName(`eval_${type}_no`)[0]?.checked;
  const unsure = document.getElementsByName(`eval_${type}_unsure`)[0]?.checked;
  const normal = document.getElementsByName(`eval_${type}_normal`)[0]?.checked;
  const abnormal = document.getElementsByName(`eval_${type}_abnormal`)[0]?.checked;

  return {
    type,
    result: yes ? "yes" : no ? "no" : unsure ? "unsure" : "unspecified",
    status: normal ? "normal" : abnormal ? "abnormal" : "unspecified"
  };
});

const otherEval_name = get("otherEval_name");
const otherEval_result = document.getElementsByName("otherEval_yes")[0]?.checked ? "yes"
                       : document.getElementsByName("otherEval_no")[0]?.checked ? "no"
                       : document.getElementsByName("otherEval_unsure")[0]?.checked ? "unsure"
                       : "unspecified";

const otherEval_status = document.getElementsByName("otherEval_normal")[0]?.checked ? "normal"
                        : document.getElementsByName("otherEval_abnormal")[0]?.checked ? "abnormal"
                        : "unspecified";

const evalAbnormalExplain = get("evalAbnormalExplain");
const diagnosisTypes = ["ds", "adhd", "asd", "dd"];
const diagnosisConditions = diagnosisTypes.map(type => ({
  name: type,
  diagnosed: document.getElementsByName(`${type}_diagnosed`)[0]?.checked,
  suspected: document.getElementsByName(`${type}_suspected`)[0]?.checked,
  never: document.getElementsByName(`${type}_never`)[0]?.checked,
  report: get(`${type}_report`)
}));

const otherConditionName = get("otherConditionName");
const otherConditionStatus = {
  diagnosed: document.getElementsByName("otherCond_diagnosed")[0]?.checked,
  suspected: document.getElementsByName("otherCond_suspected")[0]?.checked,
  never: document.getElementsByName("otherCond_never")[0]?.checked,
  report: get("otherCond_report")
};
const biomedMedications = Array.from(document.getElementsByName("biomed_medication[]")).map((_, i) => ({
  name: document.getElementsByName("biomed_medication[]")[i]?.value.trim(),
  dosage: document.getElementsByName("biomed_dosage[]")[i]?.value.trim(),
  duration: document.getElementsByName("biomed_duration[]")[i]?.value.trim(),
  comments: document.getElementsByName("biomed_comments[]")[i]?.value.trim()
})).filter(row => row.name);
const therapyHistory = [
  {
    type: "Occupational therapy",
    agency: get("therapy_oc_agency"),
    duration: get("therapy_oc_duration"),
    eval: get("therapy_oc_evalReview"),
    improvements: get("therapy_oc_improvements")
  },
  {
    type: "Physical therapy",
    agency: get("therapy_pt_agency"),
    duration: get("therapy_pt_duration"),
    eval: get("therapy_pt_evalReview"),
    improvements: get("therapy_pt_improvements")
  },
  {
    type: "Speech/Language therapy",
    agency: get("therapy_speech_agency"),
    duration: get("therapy_speech_duration"),
    eval: get("therapy_speech_evalReview"),
    improvements: get("therapy_speech_improvements")
  },
  {
    type: "Psychology",
    agency: get("therapy_psych_agency"),
    duration: get("therapy_psych_duration"),
    eval: get("therapy_psych_evalReview"),
    improvements: get("therapy_psych_improvements")
  },
  {
    type: "Behavioral therapy",
    agency: get("therapy_beh_agency"),
    duration: get("therapy_beh_duration"),
    eval: get("therapy_beh_evalReview"),
    improvements: get("therapy_beh_improvements")
  },
  {
    type: get("therapy_other_name") || "Other",
    agency: get("therapy_other_agency"),
    duration: get("therapy_other_duration"),
    eval: get("therapy_other_evalReview"),
    improvements: get("therapy_other_improvements")
  }
].filter(t => t.agency || t.duration || t.eval || t.improvements);
// ========== OBSERVATION NOTES ==========
const obs_general_groomed = getRadioValue("obs_general_groomed");
const obs_general_facial = getRadioValue("obs_general_facial");
const obs_general_activity = getRadioValue("obs_general_activity");
const obs_general_transitions = getRadioValue("obs_general_transitions");

const obs_parentAttachment = getRadioValue("obs_parentAttachment");
const obs_parentSeparationAnxiety = getRadioValue("obs_parentSeparationAnxiety");
const obs_parentCompliance = getRadioValue("obs_parentCompliance");

const obs_social_initiation = getRadioValue("obs_social_initiation");
const obs_social_eyeContact = getRadioValue("obs_social_eyeContact");
const obs_social_sharedAttention = getRadioValue("obs_social_sharedAttention");

const obs_comm_verbal = getRadioValue("obs_comm_verbal");
const obs_comm_echolalia = getRadioValue("obs_comm_echolalia");
const obs_comm_nonverbal = getRadioValue("obs_comm_nonverbal");

const obs_motor_flapping = getRadioValue("obs_motor_flapping");
const obs_motor_tiptoe = getRadioValue("obs_motor_tiptoe");
const obs_motor_fineMotor = getRadioValue("obs_motor_fineMotor");

const obs_emotion_mood = getRadioValue("obs_emotion_mood");
const obs_emotion_frustration = getRadioValue("obs_emotion_frustration");
const obs_emotion_calming = getRadioValue("obs_emotion_calming");

const obs_play_imaginative = getRadioValue("obs_play_imaginative");
const obs_play_constructive = getRadioValue("obs_play_constructive");
const obs_play_repetitive = getRadioValue("obs_play_repetitive");

const obs_sens_noise = getRadioValue("obs_sens_noise");
const obs_sens_touch = getRadioValue("obs_sens_touch");
const obs_sens_visual = getRadioValue("obs_sens_visual");

const obs_rigidity_routines = getRadioValue("obs_rigidity_routines");
const obs_rigidity_fixations = getRadioValue("obs_rigidity_fixations");

const obs_cooperation_compliant = getRadioValue("obs_cooperation_compliant");
const obs_cooperation_attention = getRadioValue("obs_cooperation_attention");

const obs_strengths = get("obs_strengths");
const obs_concerns = get("obs_concerns");
let reportData = {
  clientInfo: {
    fullName: childFullName,
    preferredName,
    dob,
    age,
    gender,
    intakeDate,
    caseManager,
    reportDate
  },
  demographic: {
    primaryLanguage,
    languageOther,
    secondaryLanguages,
    languageExposure,
    maritalStatus: parentMaritalStatus,
    maritalOther,
    household1Name,
    residence1,
    household1Members: household1Names.map((name, i) => ({
      name,
      relation: household1Relations[i] || "unknown",
      age: household1Ages[i] || "?"
    })),
    household2Name,
    residence2,
    household2Members: household2Names.map((name, i) => ({
      name,
      relation: household2Relations[i] || "unknown",
      age: household2Ages[i] || "?"
    })),
    siblings: siblingNames.map((name, i) => ({
      name,
      age: siblingAges[i] || "?"
    })),
    extendedFamilyInvolvement,
    primaryConcerns,
    desiredOutcomes,
    additionalNotes
  },
  pregnancyHistory: {
    motherAgeAtBirth,
    fatherAgeAtBirth,
    degreeOfConsanguinity,
    motherOccEdu,
    fatherOccEdu,
    numMotherPregnancies,
    liveBirths,
    stillBirths,
    pregnancyPlanned,
    fertilityTreatments,
    tookMedicationsYesNo,
    pregMedications,
    pregMedOther,
    multipleBirthNew,
    multipleBirthType,
    identicalOrFraternal,
    pregDrugUsed,
    pregDrugSpec,
    difficultPregYesNo,
    pregnancyDifficulties,
    pregDiffExplain
  },
  deliveryHistory: {
  pitocinUsedNew,
  deliveryMode,
  deliveryModeOtherText, // ✅ new
  prematureBirthNew,
  prematureWeeksNew,
  laborDeliveryComplications,
  ldComplicationsSpecify,
  problemsInHospitalYesNo,
  hospitalProblems,
  nicuAdmitNew,
  nicuDischargedDays,
  nicuReasonNew,
  csectionReasonNew,
  laborComplicationsList
},

  dietAndCAM: {
    currentAllergies2,
    allergiesList2,
    specialDiet2,
    specialDietChecklist
  },
  developmentalHistory: {
    devSocial,
    devCognitive,
    devLanguage,
    langApproxWords,
    devPhysical,
    devGrooming,
    devFeeding,
    devDressing,
    foodSleepReq2,
    lossSkill2,
    lossSkillExplain2,
    lossSkillAge2
  },
  sensoryProfile: {
    affectTraits,
    sensVision,
    sensTactile,
    sensHearing,
    sensTaste,
    sensBodyAwareness,
    sensSmell,
    sensVestibular,
    sensInteroception,
    sensReacts
  },
  education: {
    currentSchool,
    schoolName,
    programGradeLevel,
    attendanceFrequency,
    specialServicesAccom,
    specialServicesType,
    handPreference,
    gradesRepeated,
    learningChallenges,
    learningChallengesExplain,
    weekdaySchedule,
    weekendSchedule,
    interestsHobbies,
    patientStrengths
  },
  behavioralProfile: {
    problemBehaviors,
    behaviorConcerns,
    friendsEasily2,
    explainFriends2,
    socialConcerns2,
    explainSocialConcerns2,
    abuseNeglectHistory,
    abuseNeglectExplain,
    recentStressors2,
    explainStressors2,
    behaviorAdditionalComments
  },
  medical: {
    medicalConditions,
    evaluations,
    otherEval_name,
    otherEval_result,
    otherEval_status,
    evalAbnormalExplain,
    diagnosisConditions,
    otherConditionName,
    otherConditionStatus
  },
  therapy: therapyHistory,
  clinicalObservations: {
    obs_general_groomed,
    obs_general_facial,
    obs_general_activity,
    obs_general_transitions,
    obs_parentAttachment,
    obs_parentSeparationAnxiety,
    obs_parentCompliance,
    obs_social_initiation,
    obs_social_eyeContact,
    obs_social_sharedAttention,
    obs_comm_verbal,
    obs_comm_echolalia,
    obs_comm_nonverbal,
    obs_motor_flapping,
    obs_motor_tiptoe,
    obs_motor_fineMotor,
    obs_emotion_mood,
    obs_emotion_frustration,
    obs_emotion_calming,
    obs_play_imaginative,
    obs_play_constructive,
    obs_play_repetitive,
    obs_sens_noise,
    obs_sens_touch,
    obs_sens_visual,
    obs_rigidity_routines,
    obs_rigidity_fixations,
    obs_cooperation_compliant,
    obs_cooperation_attention,
    obs_strengths,
    obs_concerns
  },
  // === NEW: OT Core (Unified) ===
  otCore: (window.__OTCore_collect ? window.__OTCore_collect() : null)
};

window.generatedReportData = reportData;

  doc += `
  <div id="generatedReport" style="padding: 40px; font-family: Arial, sans-serif;">
    <style>
      @page {
        size: A4 portrait;
        margin: 2.5cm 2cm;
      }
      .cover-page, .info-page {
        page-break-after: always;
        text-align: center;
        padding-top: 150px;
      }
      .cover-page h1 {
        font-size: 48px;
        color: red;
        margin: 20px 0 10px;
      }
      .cover-page p {
        font-size: 24px;
      }
      .logo {
        height: 80px;
        margin-bottom: 20px;
      }
      .header, .footer {
        text-align: center;
        font-size: 14px;
        color: #666;
        border-bottom: 1px solid #ccc;
        padding: 10px 0;
        margin-bottom: 10px;
      }
      .section {
        margin: 0 0 40px 0;
        padding-top: 1cm;
        padding-bottom: 1cm;
        text-align: left;
        page-break-inside: avoid;
      }
      .section h2 {
        color: #345feb;
        border-bottom: 2px solid #ccc;
        padding-bottom: 5px;
      }
      .section p {
        margin: 10px 0;
        line-height: 1.6;
      }
    </style>
`;

  doc += `
   <div class="footer">
  Dr. Muhannad Fraihat | Riyadh, Saudi Arabia<br> |
</div>

  `; 

  doc += `
<div class="header" style="text-align: center; border-bottom: 1px solid #ccc; padding: 10px 0; background: white;">
  <div class="brand-name">Dr. Muhannad Fraihat</div>
</div>
<div style="font-size: 14px; color: #1a3e80;">
  Comprehensive Autism Assessment Tool (CAAT)
</div>

</div>  
  <div class="info-page">
      <h2>Confidentiality Notice</h2>
      <p style="margin: 30px auto; max-width: 600px;">
        The contents of this report are of a confidential and sensitive nature and should not be duplicated without the consent of the parents. The data contained herein is valid for a limited period and due to the changing and developing nature of children, the information and recommendations are meant for current use. Reference to or use of this report in future years should be made with caution.
      </p>
      <div class="section">
        <h2>Client Information</h2>
        <p><strong>Name:</strong> ${childFullName}</p>
        <p><strong>Date of Birth:</strong> ${dob}</p>
        <p><strong>Intake Date:</strong> ${intakeDate}</p>
        <p><strong>Age at Assessment:</strong> ${age}</p>
        <p><strong>Reported by:</strong> ${caseManager}</p>
        <p><strong>Date of Report:</strong> ${reportDate}</p>
      </div>
    </div>
  `;

 doc += `
  <div class="section">
    <h2>${t.demographicSummary}</h2>
    <ul>
      <li><strong>${t.fullNameLabel}:</strong> ${childFullName}</li>
  <li><strong>${t.preferredNameLabel}:</strong> ${preferredName || "N/A"}</li>
  <li><strong>${t.ageLabel}:</strong> ${age}</li>
  <li><strong>${t.genderLabel}:</strong> ${gender}</li>
  <li><strong>${t.dobLabel}:</strong> ${dob || "unspecified"}</li>
  <li><strong>${t.primaryLangLabel}:</strong> ${primaryLanguage}${languageOther ? ` (${languageOther})` : ""}</li>
  <li><strong>${t.secondaryLangLabel}:</strong> ${secondaryLanguages || "None reported"}</li>
  <li><strong>${t.maritalStatusLabel}:</strong> ${parentMaritalStatus}${maritalOther ? ` (${maritalOther})` : ""}</li>
  <li><strong>${t.extendedFamilyLabel}:</strong> ${extendedFamilyInvolvement || "Not reported"}</li>
  <li><strong>${t.household1Label}:</strong> ${household1Name || "Not specified"}</li>
  <li><strong>${t.residence1Label}:</strong> ${residence1 || "Not specified"}%</li>
  <li><strong>${t.household1MembersLabel}:</strong><br/>
    ${
      household1Names.length
        ? household1Names.map((n, i) =>
            `- ${n} (${household1Relations[i] || "relation unknown"}, age ${household1Ages[i] || "?"})`
          ).join("<br/>")
        : "No additional individuals listed"
    }
  </li>
  ${
    parentMaritalStatus !== "married" && household2Name
      ? `
  <li><strong>${t.household2Label}:</strong> ${household2Name}</li>
  <li><strong>${t.residence2Label}:</strong> ${residence2 || "Not specified"}%</li>
  <li><strong>${t.household2MembersLabel}:</strong><br/>
    ${
      household2Names.length
        ? household2Names.map((n, i) =>
            `- ${n} (${household2Relations[i] || "relation unknown"}, age ${household2Ages[i] || "?"})`
          ).join("<br/>")
        : "No additional individuals listed"
    }
  </li>`
      : `<li><strong>Secondary Household:</strong> Not reported</li>`
  }
  ${
    siblingNames.length
      ? `<li><strong>${t.siblingsLabel}:</strong><br/>
        ${siblingNames.map((n, i) => `- ${n} (age ${siblingAges[i] || "?"})`).join("<br/>")}
      </li>`
      : ""
  }
  <li><strong>${t.primaryConcernsLabel}:</strong> ${primaryConcerns || "Not provided"}</li>
  <li><strong>${t.desiredOutcomesLabel}:</strong> ${desiredOutcomes || "Not specified"}</li>
  ${additionalNotes ? `<li><strong>${t.additionalNotesLabel}:</strong> ${additionalNotes}</li>` : ""}
`;
doc += `
  <div class="section">
    <h2>${t.backgroundHistory}</h2>
    <ul>
      <li><strong>${t.motherAgeLabel}:</strong> ${motherAgeAtBirth || "unspecified"}</li>
<li><strong>${t.fatherAgeLabel}:</strong> ${fatherAgeAtBirth || "unspecified"}</li>
<li><strong>${t.consanguinityLabel}:</strong> ${degreeOfConsanguinity || "not specified"}</li>
<li><strong>${t.motherEduLabel}:</strong> ${motherOccEdu || "not provided"}</li>
<li><strong>${t.fatherEduLabel}:</strong> ${fatherOccEdu || "not provided"}</li>
<li><strong>${t.pregnancyCountLabel}:</strong> ${numMotherPregnancies || "unspecified"}</li>
<li><strong>${t.liveBirthsLabel}:</strong> ${liveBirths || "?"}</li>
<li><strong>${t.stillBirthsLabel}:</strong> ${stillBirths || "0"}</li>
<li><strong>${t.pregnancyPlannedLabel}:</strong> ${pregnancyPlanned || "unspecified"}</li>
<li><strong>${t.fertilityLabel}:</strong> ${fertilityTreatments || "not mentioned"}</li>
<li><strong>${t.medicationsLabel}:</strong> ${tookMedicationsYesNo === "yes" ? (pregMedications.join(", ") || "none listed") + (pregMedOther ? `, and also: ${pregMedOther}` : "") : "None reported"}</li>
<li><strong>${t.multipleBirthLabel}:</strong> ${multipleBirthNew === "yes" ? `${multipleBirthType || "unspecified type"}, ${identicalOrFraternal || "unspecified"}` : "No"}</li>
<li><strong>${t.drugUseLabel}:</strong> ${pregDrugUsed === "yes" ? pregDrugSpec || "unspecified substances" : "No use reported"}</li>
<li><strong>${t.complicationsLabel}:</strong> ${difficultPregYesNo === "yes" ? (pregnancyDifficulties.join(", ") || "unspecified") + `. Notes: ${pregDiffExplain || "none"}` : "None reported"}</li>
<li><strong>${t.pitocinLabel}:</strong> ${pitocinUsedNew || "not reported"}</li>
<li><strong>${t.deliveryLabel}:</strong> ${deliveryMode || "unspecified"}${deliveryMode === "c-section" && csectionReasonNew ? ` (Reason: ${csectionReasonNew})` : ""}</li>
<li><strong>${t.prematureLabel}:</strong> 
  ${prematureBirthNew === "yes"
    ? `Yes${prematureWeeksNew ? ` – ${prematureWeeksNew} weeks` : ""}`
    : prematureBirthNew || "Not reported"}
</li>
<li><strong>${t.laborCompLabel}:</strong> 
  ${
    laborDeliveryComplications === "yes"
      ? (
          laborComplicationsList.length
            ? `${laborComplicationsList.join(", ")}`
            : ldComplicationsSpecify || "unspecified"
        ) +
        (laborComplicationsList.includes("other") && complicationOtherText
          ? `. Other: ${complicationOtherText}`
          : "")
      : "None"
  }
</li>

<li><strong>${t.neonatalCompLabel}:</strong> ${problemsInHospitalYesNo === "yes" ? hospitalProblems.join(", ") || "not specified" : "None"}</li>
<li><strong>${t.nicuLabel}:</strong> ${nicuAdmitNew === "yes" ? `Yes (${nicuDischargedDays || "duration unspecified"} days), Reason: ${nicuReasonNew || "not specified"}` : "No"}</li>
    </ul>

    <h3>${t.dietaryHeading}</h3>
<ul>
  <li><strong>${t.allergiesLabel}:</strong> ${currentAllergies2 === "yes" ? allergiesList2 || "unspecified items" : "No known allergies"}</li>
  <li><strong>${t.specialDietLabel}:</strong> ${specialDiet2 === "yes" ? specialDietChecklist.join(", ") || "none specified" : "Not reported"}</li>
</ul>


    <h3>${t.milestonesHeading}</h3>
<ul>
  <li><strong>${t.socialMilestonesLabel || "Social Milestones"}:</strong><br/>
  ${
    Object.entries(devSocial)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${t[k] || k.replace("soc_", "")}: ${v}
`)
      .join(", ") || "Not reported"
  }
</li>

  <li><strong>${t.cognitiveMilestonesLabel || "Cognitive Milestones"}:</strong><br/>

  ${
    Object.entries(devCognitive)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${t["cog_" + k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>

  <li><strong>${t.languageMilestonesLabel || "Language Milestones"}:</strong><br/>
  ${
    Object.entries(devLanguage)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${t["lang_" + k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>

  <li><strong>${t.physicalMilestonesLabel || "Physical Milestones"}:</strong><br/>
  ${
    Object.entries(devPhysical)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${t["phy_" + k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>
</ul>


    <h3>${t.dailyLivingHeading}</h3>
<ul>
  <li><strong>${t.groomingLabel}:</strong><br/>
  ${
    Object.entries(devGrooming)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${t[k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>
<li><strong>${t.feedingLabel}:</strong><br/>
  ${
    Object.entries(devFeeding)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${t[k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>
<li><strong>${translations[currentLanguage].dressingLabel}:</strong><br/>
  ${
    Object.entries(devDressing)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${t[k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>
  <li><strong>${t.foodSleepLabel}:</strong> ${foodSleepReq2 || "Not described"}</li>
  <li><strong>${t.regressionLabel}:</strong> ${lossSkill2 === "yes" ? `Yes. Explanation: ${lossSkillExplain2 || "Not provided"}. Age noticed: ${lossSkillAge2 || "Not specified"}` : "No"}</li>
</ul>


    <h3><h3>${t.sensoryHeading}</h3>
<ul>
  <li><strong>${t.affectLabel}:</strong> ${affectTraits.join(", ") || "Not specified"}</li>
  <li><strong>${t.domainSensoryLabel}:</strong>
    Vision (${sensVision || "n/a"}), Tactile (${sensTactile || "n/a"}), Hearing (${sensHearing || "n/a"}),
    Taste (${sensTaste || "n/a"}), Body Awareness (${sensBodyAwareness || "n/a"}), Smell (${sensSmell || "n/a"}),
    Vestibular (${sensVestibular || "n/a"}), Interoception (${sensInteroception || "n/a"})
  </li>
  <li><strong>${t.reactionsLabel}:</strong> ${
    sensReacts.length 
      ? sensReacts.map(item => t["sens" + capitalize(item)] || item).join(", ")
      : (t.none || "None observed")
  }
  </li>
</ul>



    <h3>${t.educationHeading}</h3>

<ul>
  <li><strong>${t.schoolLabel}:</strong> ${currentSchool === "yes" ? `Yes (${schoolName || "unnamed school"})` : "No"}</li>
  <li><strong>${t.gradeLabel}:</strong> ${programGradeLevel || "Not specified"}</li>
  <li><strong>${t.attendanceLabel}:</strong> ${attendanceFrequency || "Unspecified"}</li>
  <li><strong>${t.accommodationsLabel}:</strong> ${specialServicesAccom === "yes" ? specialServicesType || "unspecified" : "None reported"}</li>
  <li><strong>${t.handLabel}:</strong> ${handPreference || "Unspecified"}</li>
  <li><strong>${t.repeatedGradesLabel}:</strong> ${gradesRepeated || "Unspecified"}</li>
  <li><strong>${t.learningLabel}:</strong> ${learningChallenges === "yes" ? learningChallengesExplain || "Not specified" : "None reported"}</li>
  <li><strong>${t.weekdayLabel}:</strong> ${weekdaySchedule || "Not described"}</li>
  <li><strong>${t.weekendLabel}:</strong> ${weekendSchedule || "Not described"}</li>
  <li><strong>${t.hobbiesLabel}:</strong> ${interestsHobbies || "Not specified"}</li>
  <li><strong>${t.strengthsLabel}:</strong> ${patientStrengths || "Not specified"}</li>
</ul>
  </div>
`;
doc += `
  <div class="section">
    <h2>${t.behaviorHeading}</h2>
    <ul>
      <li><strong>${t.problemBehaviorLabel}:</strong>
        ${problemBehaviors.length
  ? problemBehaviors.map(b => t["pb" + capitalize(b)] || b).join(", ")
  : t.none || "None reported"}

      </li>
      <li><strong>${t.behaviorObservationLabel}:</strong> ${behaviorConcerns || "Not specified"}</li>
      <li><strong>${t.socialFunctioningLabel}:</strong>
        ${
          friendsEasily2 === "yes"
            ? "Makes friends easily"
            : `Does not make friends easily. ${explainFriends2 || "No additional explanation provided."}`
        }
        ${
          socialConcerns2 === "yes"
            ? `<br/>Concerns reported: ${explainSocialConcerns2 || "Not detailed"}`
            : ""
        }
      </li>
      <li><strong>${t.traumaLabel}:</strong> ${abuseNeglectHistory || "Unspecified"}
        ${abuseNeglectExplain ? `<br/>Details: ${abuseNeglectExplain}` : ""}
      </li>
      <li><strong>${t.stressorsLabel}:</strong> 
        ${recentStressors2 === "yes" ? `Yes – ${explainStressors2 || "Not specified"}` : "None reported"}
      </li>
      ${behaviorAdditionalComments
        ? `<li><strong>${t.behaviorNotesLabel}:</strong> ${behaviorAdditionalComments}</li>`
        : ""}
    </ul>

    <h2>Medical and Developmental History</h2>
    <ul>
      <li><strong>Medical Conditions:</strong><br/>
        ${medicalConditions.map(c => `${c.condition}: ${c.status}`).join(", ")}
      </li>
      <li><strong>Evaluations:</strong><br/>
        <ul>
          ${evaluations.map(e => `<li>${e.type} – Result: ${e.result}, Status: ${e.status}</li>`).join("")}
          ${
            otherEval_name
              ? `<li>Other Evaluation – ${otherEval_name}: Result: ${otherEval_result}, Status: ${otherEval_status}</li>`
              : ""
          }
        </ul>
      </li>
      ${evalAbnormalExplain
        ? `<li><strong>Explanation of Abnormal Findings:</strong> ${evalAbnormalExplain}</li>`
        : ""}
    </ul>

    <h3>Diagnosed or Suspected Conditions</h3>
    <ul>
      ${diagnosisConditions.map(d => {
        const status = d.diagnosed
          ? "Diagnosed"
          : d.suspected
          ? "Suspected"
          : d.never
          ? "Never"
          : "Not stated";
        return `<li>${d.name.toUpperCase()}: ${status}${
          d.report ? ` – Report: ${d.report}` : ""
        }</li>`;
      }).join("")}
      ${
        otherConditionName
          ? `<li>${otherConditionName}: ${
              otherConditionStatus.diagnosed
                ? "Diagnosed"
                : otherConditionStatus.suspected
                ? "Suspected"
                : otherConditionStatus.never
                ? "Never"
                : "Not specified"
            }${
              otherConditionStatus.report
                ? ` – Report: ${otherConditionStatus.report}`
                : ""
            }</li>`
          : ""
      }
    </ul>

    ${
      biomedMedications.length
        ? `<h3>Biomedical Interventions</h3>
          <table border="1" cellpadding="5" cellspacing="0">
            <thead>
              <tr><th>Medication</th><th>Dosage / Time</th><th>Duration</th><th>Comments</th></tr>
            </thead>
            <tbody>
              ${biomedMedications.map(m => `
                <tr>
                  <td>${m.name}</td>
                  <td>${m.dosage}</td>
                  <td>${m.duration}</td>
                  <td>${m.comments}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>`
        : ""
    }

    ${
      therapyHistory.length
        ? `<h3>Therapy History</h3>
          <table border="1" cellpadding="5" cellspacing="0">
            <thead>
              <tr><th>Therapy</th><th>Agency / Therapist</th><th>Duration</th><th>Evaluations Available</th><th>Improvements</th></tr>
            </thead>
            <tbody>
              ${therapyHistory.map(t => `
                <tr>
                  <td>${t.type}</td>
                  <td>${t.agency}</td>
                  <td>${t.duration}</td>
                  <td>${t.eval}</td>
                  <td>${t.improvements}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>`
        : ""
    }
  </div>
`;
doc += `
  <div class="section">
    <h2>${t.clinicalObservations}</h2>
    <ul>
      <li><strong>Grooming & Appearance:</strong> ${obs_general_groomed === "yes" ? "Well-groomed" : obs_general_groomed === "no" ? "Disheveled or inappropriate attire" : "Not observed"}</li>
      <li><strong>Facial Expression:</strong> ${obs_general_facial === "yes" ? "Neutral/appropriate" : "Unusual or atypical"}</li>
      <li><strong>Activity Level:</strong> ${obs_general_activity === "yes" ? "Age-appropriate and regulated" : "Hyperactive or hypoactive"}</li>
      <li><strong>Transitions:</strong> ${obs_general_transitions === "yes" ? "Smooth and cooperative" : "Difficult or resistant"}</li>

      <li><strong>Attachment to Parent/Guardian:</strong> ${obs_parentAttachment === "yes" ? "Secure attachment observed" : "Avoidant or limited attachment behaviors"}</li>
      <li><strong>Separation from Parent:</strong> ${obs_parentSeparationAnxiety === "yes" ? "Separation anxiety noted" : "Handled separation calmly"}</li>
      <li><strong>Compliance with Parent:</strong> ${obs_parentCompliance === "yes" ? "Generally compliant" : "Oppositional or noncompliant"}</li>

      <li><strong>Initiation of Interaction with Clinician:</strong> ${obs_social_initiation === "yes" ? "Initiates interaction" : "Requires prompting"}</li>
      <li><strong>Eye Contact:</strong> ${obs_social_eyeContact === "yes" ? "Spontaneous and appropriate" : "Limited or inconsistent"}</li>
      <li><strong>Shared Enjoyment/Joint Attention:</strong> ${obs_social_sharedAttention === "yes" ? "Present" : "Not consistently observed"}</li>

      <li><strong>Verbal Communication:</strong> ${obs_comm_verbal === "yes" ? "Present and functional" : "Limited or absent"}</li>
      <li><strong>Echolalia:</strong> ${obs_comm_echolalia === "yes" ? "Observed" : "Not observed"}</li>
      <li><strong>Nonverbal Communication:</strong> ${obs_comm_nonverbal === "yes" ? "Used effectively" : "Not reliably used"}</li>

      <li><strong>Hand-Flapping or Stimming:</strong> ${obs_motor_flapping === "yes" ? "Observed" : "Not observed"}</li>
      <li><strong>Toe Walking:</strong> ${obs_motor_tiptoe === "yes" ? "Observed" : "Not observed"}</li>
      <li><strong>Fine Motor Skills:</strong> ${obs_motor_fineMotor === "yes" ? "Age-appropriate" : "Delayed or uncoordinated"}</li>

      <li><strong>Overall Mood:</strong> ${obs_emotion_mood === "yes" ? "Calm and content" : "Variable or irritable"}</li>
      <li><strong>Frustration Tolerance:</strong> ${obs_emotion_frustration === "yes" ? "Tolerates well" : "Low tolerance"}</li>
      <li><strong>Self-Regulation:</strong> ${obs_emotion_calming === "yes" ? "Effective or independent" : "Not reliably observed"}</li>

      <li><strong>Imaginative Play:</strong> ${obs_play_imaginative === "yes" ? "Observed" : "Mostly functional or repetitive"}</li>
      <li><strong>Constructive Play:</strong> ${obs_play_constructive === "yes" ? "Age-appropriate" : "Not demonstrated"}</li>
      <li><strong>Repetitive/Fixated Play:</strong> ${obs_play_repetitive === "yes" ? "Present" : "Not observed"}</li>

      <li><strong>Response to Loud Sounds:</strong> ${obs_sens_noise === "yes" ? "Overreactive" : "Tolerant"}</li>
      <li><strong>Response to Touch:</strong> ${obs_sens_touch === "yes" ? "Sensitive" : "Tolerant"}</li>
      <li><strong>Response to Visual Stimuli:</strong> ${obs_sens_visual === "yes" ? "Fixated or fascinated" : "Not reactive"}</li>

      <li><strong>Rigidity (Routine Dependence):</strong> ${obs_rigidity_routines === "yes" ? "Observed" : "Not evident"}</li>
      <li><strong>Fixated Interests:</strong> ${obs_rigidity_fixations === "yes" ? "Present" : "Not observed"}</li>

      <li><strong>Compliance with Clinician:</strong> ${obs_cooperation_compliant === "yes" ? "Follows directions" : "Resistant or defiant"}</li>
      <li><strong>Attention to Tasks:</strong> ${obs_cooperation_attention === "yes" ? "Sustained" : "Limited"}</li>

      <li><strong>Strengths Observed:</strong> ${obs_strengths || "Not specified by the clinician."}</li>
      <li><strong>Concerns and Clinical Impressions:</strong> ${obs_concerns || "None noted by the observer."}</li>
    </ul>
  </div>
`;
doc += `
  <div class="section">
    ${evaluateDSM5(reportData)}
  </div>
`;

doc += `
  <div class="section">
    <h2>${t.signatureHeading}</h2>
    <p><strong>${t.caseManagerNameLabel}:</strong> ${caseManager || "Not provided"}</p>
    <p><strong>${t.caseManagerSignatureLabel}:</strong> ${get("caseManagerSignature") || "Not signed"}</p>
    <p><strong>${t.submissionDateLabel}:</strong> ${intakeDate || "Not dated"}</p>
    <p style="margin-top: 30px;">${t.confirmationStatement}</p>
  </div>
`;


if (therapyHistory.length > 0) {
  doc += `<div class="section"><h2>Therapy History</h2>`;
  therapyHistory.forEach(t => {
    doc += `
      <p><strong>Type:</strong> ${t.type}</p>
      <p><strong>Agency:</strong> ${t.agency || "Not specified"}</p>
      <p><strong>Duration:</strong> ${t.duration || "Not specified"}</p>
      <p><strong>Evaluations Available:</strong> ${t.eval || "Not specified"}</p>
      <p><strong>Improvements:</strong> ${t.improvements || "Not specified"}</p>
      <hr/>
    `;
  });
  doc += `</div>`;
}

 container.innerHTML = doc;
container.style.display = "block";
const opt = {
  margin:       0.5,
  filename:     'Autism_Diagnostic_Intake_Report_ADIR.pdf',
  image:        { type: 'jpeg', quality: 0.98 },
  html2canvas:  { scale: 2 },
  jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
};
}
function evaluateDSM5(data) {
  const t = translations[currentLanguage] || translations.en;
  const name = data.clientInfo.fullName.split(" ")[0].toUpperCase();

  const hasAllA = (
    data.clinicalObservations.obs_social_eyeContact === "no" &&
    data.clinicalObservations.obs_comm_nonverbal === "no" &&
    data.behavioralProfile.friendsEasily2 === "no"
  );

  const B1 = data.clinicalObservations.obs_comm_echolalia === "yes" || data.clinicalObservations.obs_motor_flapping === "yes";
  const B2 = data.clinicalObservations.obs_rigidity_routines === "yes";
  const B3 = data.clinicalObservations.obs_rigidity_fixations === "yes";
  const B4 = ["yes"].includes(data.sensoryProfile.sensTactile) ||
             ["yes"].includes(data.sensoryProfile.sensHearing) ||
             ["yes"].includes(data.sensoryProfile.sensTaste) ||
             ["yes"].includes(data.sensoryProfile.sensSmell);

  const Bcount = [B1, B2, B3, B4].filter(Boolean).length;

  const hasC = data.developmentalHistory.lossSkill2 === "yes";
  const hasD = data.behavioralProfile.problemBehaviors.length >= 2;
  const hasE = true;

  const isASD = hasAllA && Bcount >= 2 && hasC && hasD && hasE;

  const recommendation = isASD
    ? `<p><strong>Recommendation:</strong> Based on the clinical findings and observed patterns, <strong>${name}</strong> meets diagnostic criteria for Autism Spectrum Disorder (ASD). A comprehensive multidisciplinary assessment is strongly advised. This should include professionals from behavior analysis, occupational therapy, clinical psychology, and speech-language pathology, aimed at individualized intervention planning.</p>`
    : `<p><strong>Recommendation:</strong> Current clinical data does not fully satisfy DSM-5 criteria for ASD. Continued developmental monitoring and follow-up evaluation are recommended as appropriate.</p>`;

  return `
    <h2 style="color: #1a3e80; margin-top: 50px;">${t.dsm5Evaluation}</h2>
    <p>This diagnostic section evaluates whether <strong>${name}</strong> meets DSM-5 criteria for Autism Spectrum Disorder based on current intake data.</p>

    <h3>Section A: Social Communication Deficits (All Required)</h3>
    <ul>
      <li>A1: Deficits in reciprocity — <strong>${data.behavioralProfile.friendsEasily2 === "no" ? "Met" : "Not Met"}</strong></li>
      <li>A2: Nonverbal communication — <strong>${data.clinicalObservations.obs_comm_nonverbal === "no" ? "Met" : "Not Met"}</strong></li>
      <li>A3: Relationships — <strong>${data.clinicalObservations.obs_social_eyeContact === "no" ? "Met" : "Not Met"}</strong></li>
    </ul>

    <h3>Section B: Repetitive Behaviors (At Least 2)</h3>
    <ul>
      <li>B1: Stereotyped movements — ${B1 ? "✔" : "✘"}</li>
      <li>B2: Inflexible routines — ${B2 ? "✔" : "✘"}</li>
      <li>B3: Fixated interests — ${B3 ? "✔" : "✘"}</li>
      <li>B4: Sensory input reactivity — ${B4 ? "✔" : "✘"}</li>
    </ul>
    <p>Total B criteria met: <strong>${Bcount}</strong></p>

    <h3>Sections C, D, E</h3>
    <ul>
      <li>C: Early developmental onset — ${hasC ? "✔" : "✘"}</li>
      <li>D: Functional impairment — ${hasD ? "✔" : "✘"}</li>
      <li>E: Not better explained by another disorder — ${hasE ? "✔" : "✘"}</li>
    </ul>

    <h3>Conclusion</h3>
    ${recommendation}
  `;
}

async function generateNarrativeReport() {
  showLoading();

  // Always regenerate intake data before AI step
  generateFullIntakeReport();

  const data = window.generatedReportData;
  if (!data) {
    alert("Something went wrong. Could not generate report data.");
    hideLoading();
    return;
  }

  const selectedLang = document.getElementById("reportLanguage").value;
  const selectedLangs = [selectedLang];

try {
  const url = `${API_BASE}/generate-report?template=adir`;
const response = await fetch(url, {
  method: "POST",
headers: { "Content-Type": "application/json" },

  body: JSON.stringify({ data, languages: selectedLangs })
});


  if (!response.ok) {
    alert("Failed to generate narrative report.");
    return;
  }

  const result = await response.json();
  const newWin = window.open("", "_blank");

  newWin.document.write(`
  <html>
    <head>
      <title>Autism Diagnostic Intake Report (ADIR)</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
        }

        @page {
          margin: 2.5cm 2cm;
        }

        .cover-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          page-break-after: always;
        }

        .cover-logo {
          text-align: center;
          margin-bottom: 40px;
        }

        .cover-logo img {
          height: 80px;
        }

        .cover-logo h2 {
          font-size: 16px;
          color: #1a3e80;
          font-weight: bold;
          margin: 10px 0 0;
        }

        .cover-logo h3 {
          font-size: 14px;
          color: #1a3e80;
          font-weight: normal;
        }

        .cover-title {
          font-size: 36px;
          font-weight: bold;
          color: red;
          margin-bottom: 10px;
        }

        .cover-subtitle {
          font-size: 20px;
          color: red;
        }

        .info-page {
          page-break-after: always;
          padding: 3cm 2cm;
        }

        .info-page h2 {
          text-align: center;
          color: #1a3e80;
          margin-bottom: 20px;
        }

        .info-page p {
          font-size: 14px;
          line-height: 1.6;
        }

        .footer {
          text-align: center;
          font-size: 12px;
          color: #1a3e80;
          margin-top: 40px;
          border-top: 1px solid #ccc;
          padding-top: 10px;
        }

        .narrative-body {
          padding: 3cm 2cm;
          font-size: 14px;
          page-break-before: always;
        }

        .narrative-body p {
          margin: 0 0 1em 0;
          line-height: 1.6;
        }
      </style>
    </head>
    <body>
      <!-- COVER PAGE -->
      <div class="cover-page">
  <div class="cover-logo">
   <div class="report-center-title">Dr. Muhannad Fraihat</div>
<h3>Comprehensive Autism Assessment Tool (CAAT)</h3>
  </div>
  <div class="cover-title">Autism Diagnostic Intake Report (ADIR)</div>
  <div class="cover-subtitle">Private and Confidential</div>

  <!-- ✅ Add this block here -->
  <div class="footer">
   Dr. Muhannad Fraihat | Riyadh, Saudi Arabia<br> |
  </div>
</div>

      <!-- CLIENT INFORMATION PAGE -->
      <div class="info-page">
        <h2>Confidentiality Notice</h2>
        <p style="text-align: justify; max-width: 700px; margin: auto;">
          The contents of this report are of a confidential and sensitive nature and should not be duplicated without the consent of the parents. The data contained herein is valid for a limited period and due to the changing and developing nature of children, the information and recommendations are meant for current use. Reference to or use of this report in future years should be made with caution.
        </p>

        <h2 style="margin-top: 40px;">Client Information</h2>
        <hr/>
       <p><strong>Name:</strong> ${safeGet(data.clientInfo, "fullName")}</p>
<p><strong>Date of Birth:</strong> ${safeGet(data.clientInfo, "dob")}</p>
<p><strong>Intake Date:</strong> ${safeGet(data.clientInfo, "intakeDate")}</p>
<p><strong>Age at Assessment:</strong> ${safeGet(data.clientInfo, "age")}</p>
<p><strong>Gender:</strong> ${safeGet(data.clientInfo, "gender")}</p>
<p><strong>Reported By:</strong> ${safeGet(data.clientInfo, "caseManager")}</p>
<p><strong>Date of Report:</strong> ${safeGet(data.clientInfo, "reportDate")}</p>

        <div class="footer">
          Dr. Muhannad Fraihat | Riyadh, Saudi Arabia<br> |
        </div>
      </div>

      
    </body>
  </html>
  `);

  newWin.document.close();
} catch (error) {
  alert("An error occurred while generating the report.");
  console.error(error);
} finally {
  hideLoading(); // ✅ Spinner always hides
}
}


function safeGet(obj, key) {
  return obj?.[key] || "Not provided";
}
// Pick backend by environment
const API_BASE =
  (location.hostname === '127.0.0.1' || location.hostname === 'localhost')
    ? 'http://localhost:5000'                // local backend (when you run it)
    : 'https://caat-backend.onrender.com';   // Render backend (deployed)

async function generateAIReportDirect() {
  showLoading();

  try {
    // If this is NOT the OT path, rebuild the ADIR payload before calling AI
    const isOT =
      !!(window.generatedReportData && window.generatedReportData.meta && String(window.generatedReportData.meta.reportType).toUpperCase() === 'OT');

    if (!isOT) {
      // ADIR flow still uses the intake report structure
      generateFullIntakeReport();
      await new Promise((r) => setTimeout(r, 200));
    }

    // Payload prepared by caller:
    // - ADIR: window.generatedReportData (from generateFullIntakeReport)
    // - OT:   window.generatedReportData (from buildOTNarrativeData) with meta.reportType="OT"
    const payload = window.generatedReportData || {};

    // Language (keep your behavior)
    const selectedLang = document.getElementById("reportLanguage")?.value || "en";
    const reportType = (payload.meta && payload.meta.reportType)
      ? String(payload.meta.reportType).toUpperCase()
      : 'ADIR';

    const templateParam = reportType === 'OT' ? 'ot' : 'adir';
    const url = `${API_BASE}/generate-report?template=${encodeURIComponent(templateParam)}`;

    // Backward-compatible body:
    //  - For ADIR we keep the old { data, languages } envelope
    //  - For OT we send the OT payload itself (plus languages)
    const body = (reportType === 'OT')
      ? { ...payload, languages: [selectedLang] }
      : { data: payload, languages: [selectedLang] };
console.log('[AI] url =', url, 'reportType =', reportType, 'body.meta =', body.meta || (body.data && body.data.meta));

    const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});


   if (res.status === 429) {
  const data = await res.json().catch(() => ({}));
  alert(
    "OpenAI quota/rate limit reached.\n\n" +
    (data?.detail || "Please add billing or raise your monthly limit, then try again.")
  );
  return; // stop here; keep spinner cleanup in finally{}
}

if (!res.ok) {
  const text = await res.text().catch(()=> '');
  throw new Error(`Backend ${res.status} ${res.statusText}${text ? ' — ' + text : ''}`);
}

    const result = await res.json();
console.log('[AI] server templateUsed =', result.templateUsed);
if ((reportType === 'OT' && result.templateUsed !== 'ot') ||
    (reportType !== 'OT' && result.templateUsed !== 'adir')) {
  alert(`Template mismatch: asked for ${reportType} but server used ${result.templateUsed}. Check logs.`);
}

    // === Render the narrative in a new window (keeps your existing UX) ===
    const newWin = window.open('', '_blank');
    if (!newWin) {
      alert('Popup was blocked. Please allow popups for this site to view the report.');
      return;
    }

    const title = reportType === 'OT'
      ? 'Occupational Therapy Evaluation Report'
      : 'Autism Diagnostic Intake Report (ADIR)';

    // Convert AI text → blue H2 headings + paragraphs (ADIR style) using a whitelist
const narrativeHtml = (() => {
  const raw = (result.report || '').replace(/\r\n/g, '\n').trim();

  // Only these lines are allowed to become headings (case-insensitive; colon/asterisks optional)
  const HEADINGS = new Set([
    'Demographic Summary',
    'Background & Referral Context',
    'Occupational Profile & Daily Routines',
    'Sensory Profile',
    'Motor Skills (Fine / Visual-Motor)',
    'Motor Skills (Gross / Praxis)',
    'ADLs & Participation',
    'Executive Function & Self-Regulation',
    'Feeding & Oral-Motor',
    'Risk & Safety',
    'Clinical Observations',
    'Strengths & Barriers',
    'Caregiver Priorities (COPM)',
    'Goals & Plan',
    'Recommendations'
  ].map(s => s.toLowerCase()));

  // Normalize lines, drop empties
  const lines = raw.split('\n').map(s => s.trim()).filter(Boolean);

  const out = [];
  let buf = [];

  const flush = () => { if (buf.length) { out.push(`<p>${buf.join(' ')}</p>`); buf = []; } };

  // Helper: strip ** … ** and trailing :
  const clean = s => s
    .replace(/^[“”"']+/, '').replace(/[”"']+$/, '')
    .replace(/^\*{1,2}\s*/, '').replace(/\s*\*{1,2}$/, '')
    .replace(/:$/, '')
    .trim();

  for (const line of lines) {
    const s = line.replace(/^[“”"']+/, '').replace(/[”"']+$/, '').trim();

    // If the whole line is a short title (with/without ** and :), and it's in our whitelist → heading
    const maybeTitle = clean(s);
    const isShort = maybeTitle.length <= 80 && !/\.\s*$/.test(maybeTitle); // not a sentence
    if (isShort && HEADINGS.has(maybeTitle.toLowerCase())) {
      flush();
      out.push(`<h2 class="report-h2">${maybeTitle}</h2>`);
      continue;
    }

    // If it's a "Title: paragraph" line and the title is whitelisted → heading + paragraph
    const m = s.match(/^(.+?):\s+(.+)$/s);
    if (m) {
      const title = clean(m[1]);
      if (HEADINGS.has(title.toLowerCase())) {
        flush();
        out.push(`<h2 class="report-h2">${title}</h2>`);
        buf.push(m[2].trim());
        continue;
      }
    }

    // Otherwise it's normal text (part of current paragraph)
    buf.push(s.replace(/^\*{1,2}|\*{1,2}$/g, ''));
  }
  flush();
  return out.join('');
})();






    // For ADIR we append the DSM-5 evaluation you already compute; OT doesn’t use it.
    const postAppend = (reportType === 'ADIR')
      ? (typeof evaluateDSM5 === 'function' ? evaluateDSM5(payload) : '')
      : '';
    const ci = payload.clientInfo || payload.client || payload.fromIntakeSnapshot || {};

    newWin.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
            @page { margin: 2.5cm 2cm; }
            .cover-page { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; page-break-after: always; }
            .cover-logo { text-align: center; margin-bottom: 40px; }
            .cover-logo img { height: 80px; }
            .cover-logo h2 { font-size: 16px; color: #1a3e80; font-weight: bold; margin: 10px 0 0; }
            .cover-logo h3 { font-size: 14px; color: #1a3e80; font-weight: normal; }
            .cover-title { font-size: 36px; font-weight: bold; color: red; margin-bottom: 10px; }
            .cover-subtitle { font-size: 20px; color: red; }
            .info-page { page-break-after: always; padding: 3cm 2cm; }
            .info-page h2 { text-align: center; color: #1a3e80; margin-bottom: 20px; }
            .info-page p { font-size: 14px; line-height: 1.6; }
            .footer { text-align: center; font-size: 12px; color: #1a3e80; margin-top: 40px; border-top: 1px solid #ccc; padding-top: 10px; }
          /* force body text to black in both OT & ADIR reports */
/* 1) Reset all narrative text to black (including strong/em, spans, etc.) */
.narrative-body, .narrative-body * {
  color:#000 !important;
  font-family: Arial, sans-serif !important;
  font-size: 14px !important;
  line-height: 1.6 !important;
  font-weight: 400 !important;       /* default to normal */
}

.info-page, .info-page * { color:#000 !important; }

/* 2) Headings stay blue — put this AFTER the reset so it wins */
.narrative-body h1,
.narrative-body h2,
.narrative-body h3,
.narrative-body h4,
.narrative-body h5,
.narrative-body h6,
.report-h2 { color:#1a3e80 !important; font-weight:600; }
/* Keep bold text black in body paragraphs */
.narrative-body b, .narrative-body strong { color:#000 !important; font-weight:600 !important; }
/* 3) Body paragraph spacing/justification (no color here) */
.narrative-body p { margin: 0 0 1em 0; line-height: 1.6; text-align: justify; }

          </style>
        </head>
        <body>
          <!-- COVER PAGE -->
          <div class="cover-page">
            <div class="cover-logo">
              <div class="report-center-title">Dr. Muhannad Fraihat</div>
<h3>Comprehensive Autism Assessment Tool (CAAT)</h3>
            </div>
            <div class="cover-title">${title}</div>
            <div class="cover-subtitle">Private and Confidential</div>
            <div class="footer">
              Dr. Muhannad Fraihat | Riyadh, Saudi Arabia<br> |
            </div>
          </div>

          <!-- INFO PAGE (ADIR shows full client info; OT shows if provided) -->
          <div class="info-page">
            <h2>Confidentiality Notice</h2>
            <p style="text-align: justify; max-width: 700px; margin: auto;">
              The contents of this report are of a confidential and sensitive nature and should not be duplicated without the consent of the parents. The data contained herein is valid for a limited period and due to the changing and developing nature of children, the information and recommendations are meant for current use. Reference to or use of this report in future years should be made with caution.
            </p>
${
  (ci && (ci.fullName || ci.name || ci.dob || ci.ageYears || ci.age || ci.gender || ci.sex || ci.intakeDate || ci.caseManager || ci.reportDate))
    ? `
      <h2 style="margin-top: 40px;">Client Information</h2>
      <hr/>
      <p><strong>Name:</strong> ${ci.fullName || ci.name || ""}</p>
      <p><strong>Date of Birth:</strong> ${ci.dob || ""}</p>
      ${ci.intakeDate ? `<p><strong>Intake Date:</strong> ${ci.intakeDate}</p>` : ""}
      <p><strong>Age at Assessment:</strong> ${ci.ageYears || ci.age || ""}</p>
      <p><strong>Gender:</strong> ${ci.gender || ci.sex || ""}</p>
      ${ci.caseManager ? `<p><strong>Reported By:</strong> ${ci.caseManager}</p>` : ""}
      <p><strong>Date of Report:</strong> ${ci.reportDate || new Date().toLocaleDateString()}</p>
    `
    : ''
}


            <div class="footer">
              | Riyadh, Saudi Arabia<br> |
            </div>
          </div>

          <!-- NARRATIVE -->
          <div class="narrative-body report-root">
            ${narrativeHtml}
            ${postAppend}
          </div>
        </body>
      </html>
    `);

    newWin.document.close();
  } catch (err) {
    console.error(err);
    alert("An error occurred while generating the AI report.\n\n" + (err?.message || err));
  } finally {
    hideLoading();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const yearSpan = document.getElementById("copyrightYear");
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
});
function openSignupModal() {
  document.getElementById("signupModal").style.display = "block";
}

function closeSignupModal() {
  document.getElementById("signupModal").style.display = "none";
}

document.getElementById("signupForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();
  const status = document.getElementById("signupStatus");

  firebase.auth().createUserWithEmailAndPassword(email, password)
  .then(async (userCredential) => {
    status.textContent = "✅ Account created successfully.";
    closeSignupModal();

    const user = userCredential.user;
    const dbRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(dbRef);

    if (userDoc.exists() && userDoc.data().isActive === true) {
      // 🎉 Already active, skip Stripe
      console.log("User is already active, skipping Stripe");
      return;
    }

    // 💳 Not active: redirect to Stripe
    fetch("https://caat-backend.onrender.com/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.url) {
        window.location.href = data.url;
      } else {
        status.textContent = "❌ Failed to redirect to payment page.";
      }
    });

  })
  .catch((error) => {
    console.error(error);
    status.textContent = "❌ " + error.message;
  });

});
function openResetModal() {
  document.getElementById("resetModal").style.display = "block";
}

function closeResetModal() {
  document.getElementById("resetModal").style.display = "none";
}

document.getElementById("resetForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const email = document.getElementById("resetEmail").value.trim();
  const status = document.getElementById("resetStatus");

  firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
      status.textContent = "✅ Reset email sent. Check your inbox.";
    })
    .catch((error) => {
      console.error(error);
      status.textContent = "❌ " + error.message;
    });
});

// Expose all necessary functions globally (must be last lines in script.js)
window.generateNarrativeReport = generateNarrativeReport;
window.generateFullIntakeReport = generateFullIntakeReport;
window.generateAIReportDirect = generateAIReportDirect;
window.openSignupModal = openSignupModal;
window.closeSignupModal = closeSignupModal;
window.openResetModal = openResetModal;
window.closeResetModal = closeResetModal;
window.switchLanguage = switchLanguage;
window.calculateAge = calculateAge;
window.addRow = addRow;
window.toggleDisplay = toggleDisplay;
window.toggleOtherField = toggleOtherField;
window.toggleHouseholdFields = toggleHouseholdFields;
window.showMainTab = showMainTab;

function showMainTab(tabName) {
  const adir = document.getElementById("adirTabs");
  const comprehensive = document.getElementById("comprehensiveTabs");
  const btnAdir = document.getElementById("btnAdir");
  const btnComprehensive = document.getElementById("btnComprehensive");

  if (tabName === "adir") {
    adir.style.display = "block";
    comprehensive.style.display = "none";
    btnAdir.classList.add("active");
    btnComprehensive.classList.remove("active");
  } else {
    adir.style.display = "none";
    comprehensive.style.display = "block";
    btnComprehensive.classList.add("active");
    btnAdir.classList.remove("active");
  }
}
// Fix: Hide active ADIR tab when switching to Comprehensive tab
window.showMainTab = function(tabName) {
  const adirTabs = document.getElementById("adirTabs");
  const comprehensiveTabs = document.getElementById("comprehensiveTabs");
  const signSubmit = document.getElementById("signSubmitReport");

  // Hide all tab-content inside ADIR
  document.querySelectorAll("#adirTabs .tab-content").forEach(el => el.classList.remove("active"));
  document.querySelectorAll("#adirTabs .tab").forEach(el => el.classList.remove("active"));

  // Hide Observation Notes explicitly
  const observation = document.getElementById("observationnotes");
  if (observation) observation.classList.remove("active");

  // Hide Sign & Submit
  if (signSubmit) signSubmit.style.display = "none";

  if (tabName === "adir") {
    adirTabs.style.display = "block";
    comprehensiveTabs.style.display = "none";
    document.getElementById("btnAdir").classList.add("active");
    document.getElementById("btnComprehensive").classList.remove("active");

    // Show first ADIR tab (hardcoded to "demographic" if exists)
    const firstTab = document.querySelector('#adirTabs .tab[data-tab="demographic"]');
    const firstContent = document.getElementById("demographic");
    if (firstTab && firstContent) {
      firstTab.classList.add("active");
      firstContent.classList.add("active");
    }

    if (signSubmit) signSubmit.style.display = "block";

  } else {
    adirTabs.style.display = "none";
    comprehensiveTabs.style.display = "block";
    document.getElementById("btnAdir").classList.remove("active");
    document.getElementById("btnComprehensive").classList.add("active");

    // Hide any remaining ADIR tab-content and tabs again (reapply)
    document.querySelectorAll("#adirTabs .tab-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll("#adirTabs .tab").forEach(el => el.classList.remove("active"));

    // Explicitly hide Observation Notes again
    if (observation) observation.classList.remove("active");

    // Reset Comprehensive to default tab
    document.querySelectorAll("#comprehensiveTabs .tab-content").forEach(el => el.classList.remove("active"));
    document.querySelectorAll("#comprehensiveTabs .tab").forEach(el => el.classList.remove("active"));
    const firstTab = comprehensiveTabs.querySelector(".tab");
    const firstContentId = firstTab?.getAttribute("data-tab");
    const firstContent = firstContentId && document.getElementById(firstContentId);
    if (firstTab && firstContent) {
      firstTab.classList.add("active");
      firstContent.classList.add("active");
    }
  }
};
// === Bind the AI button (module-safe) ===
document.addEventListener("DOMContentLoaded", () => {
  const aiBtn = document.getElementById("generateAiBtn");
  if (aiBtn) {
    aiBtn.addEventListener("click", async (e) => {
      e.preventDefault();           // stop form submit/reload
      showLoading();
      generateFullIntakeReport();
      await generateAIReportDirect();
    });
  }
    // === OT CORE INIT (ADD THIS) ===
  const otCoreHost = document.getElementById('ot-core-form');
  if (otCoreHost && window.__OTCore_init) {
    window.__OTCore_init();
  }
  // === OT ONLY: bind the page button ===
  const otBtn = document.getElementById('generateOTBtn');
  if (otBtn) {
    otBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      showLoading();
      await generateOTNarrativeDirect();   // defined at file end in Step 4A #3
    });
  }
  // === Expanded OT sections (COPM + GAS etc.) ===
  if (window.__OTX_init) {
    window.__OTX_init();
  }

});
/* ======================= CAAT-OT CORE (Unified Form) ======================= */
(function(){

  // 0–4 scale used across domains
  const SCALE = [
    { v: 0, label: "Never" },
    { v: 1, label: "Rarely" },
    { v: 2, label: "Sometimes" },
    { v: 3, label: "Often" },
    { v: 4, label: "Always" }
  ];

  // Domain lists (v1). Each subdomain gets a single 0–4 rating + notes.
  const OTCORE = {
    Sensory: ["Auditory","Visual","Tactile","Vestibular","Proprioception","Oral","Interoception"],
    "Motor – Fine": ["Grasp/Release","In-hand Manipulation","Bilateral Coordination","Visual Motor / Handwriting"],
    "Motor – Gross": ["Postural Control","Balance","Praxis","Strength/Endurance"],
    "ADL/Participation": ["Feeding","Dressing (Upper)","Dressing (Lower)","Toileting","Grooming/Hygiene","Bathing/Showering","Sleep","Play/Leisure","School/Participation"],
    "Adaptive Behavior": ["Communication","Daily Living","Socialization"]
  };

  // Safe accessors
  function getCase(){ return (typeof getCurrentCaseDoc === 'function')
      ? getCurrentCaseDoc()
      : (window.__CURRENT_CASE__ = (window.__CURRENT_CASE__ || {})); }
  function ensureOTA(){ const c = getCase(); c.otAssessment = c.otAssessment || {}; return c.otAssessment; }
  function $(id){ return document.getElementById(id); }
  function el(html){ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstChild; }
  function escapeHTML(s){ return (s??"").toString().replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

  // Renders one section (table of subdomains)
  function section(label, subs, key){
    const rows = subs.map(sub=>{
      const id = `otc_${key}_${sub}`.replace(/[^\w]/g,'_');
      const opts = SCALE.map(o=>`<option value="${o.v}">${o.label}</option>`).join('');
      return `<tr>
        <td>${sub}</td>
        <td>
          <select class="otcore-rate" id="${id}" data-group="${key}" data-sub="${sub}">
            <option value="" selected>--</option>${opts}
          </select>
        </td>
        <td><input class="otcore-notes" data-for="${id}" placeholder="Notes"></td>
      </tr>`;
    }).join('');
    return `
      <div class="card p-12 mb-12">
        <h4>${label}</h4>
        <table class="table">
          <thead><tr><th>Domain</th><th>Rating</th><th>Notes</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  function renderOTCoreForm(){
    const host = $('ot-core-form');
    if(!host) return;

    host.innerHTML = [
      section('Sensory Processing', OTCORE['Sensory'], 'Sensory'),
      section('Motor — Fine', OTCORE['Motor – Fine'], 'Motor_Fine'),
      section('Motor — Gross', OTCORE['Motor – Gross'], 'Motor_Gross'),
      section('ADL / Participation', OTCORE['ADL/Participation'], 'ADL'),
      section('Adaptive Behavior', OTCORE['Adaptive Behavior'], 'Adaptive')
    ].join('');

    // Controls + Results
    const controls = el(`<div class="mt-8">
      <button class="btn primary" id="ot-core-compute">Compute & Save</button>
    </div>`);
    host.appendChild(controls);

    const res = el(`<div id="ot-core-results" class="mt-12"></div>`);
    host.appendChild(res);

    $('ot-core-compute').addEventListener('click', computeAndSave);
  }

  // Compute indices (0–100) and severity labels
  function computeAndSave(){
    const selects = Array.from(document.querySelectorAll('.otcore-rate'));
    const noteMap = Array.from(document.querySelectorAll('.otcore-notes'))
      .reduce((acc,el)=>{ acc[el.dataset.for]=el.value.trim(); return acc; },{});

    const groups = {};
    const agg = {}; // { group: {sum, n} }

    selects.forEach(sel=>{
      const g = sel.dataset.group;
      const sub = sel.dataset.sub;
      const v = sel.value === "" ? null : Number(sel.value);
      groups[g] = groups[g] || {};
      groups[g][sub] = { raw: v, notes: noteMap[sel.id] || "" };
      if(v!=null){
        agg[g] = agg[g] || { sum:0, n:0 };
        agg[g].sum += v;
        agg[g].n += 1;
      }
    });

    const results = {};
    Object.keys(groups).forEach(g=>{
      const n = agg[g]?.n || 0;
      const sum = agg[g]?.sum || 0;
      const avg = n ? (sum / n) : null;           // 0–4
      const index = avg!=null ? Math.round(avg * 25) : null; // 0–100
      results[g] = {
        subdomains: groups[g],
        average: avg,
        index,
        severity: classify(index)
      };
    });

    // Save into case document
    const ota = ensureOTA();
    ota.otCore = results;

    paintResults(results);

    if(typeof toast === 'function') toast('OT Core scores computed & saved.');
    else console.log('[OTCore] saved', results);
  }

  function classify(index){
    if(index==null) return "";
    if(index >= 75) return "Typical";
    if(index >= 60) return "Mild Difficulty";
    if(index >= 40) return "Moderate Difficulty";
    return "Severe Difficulty";
  }

  function paintResults(results){
    const host = $('ot-core-results');
    if(!host) return;
    const cards = Object.entries(results).map(([g,v])=>{
      const subs = Object.entries(v.subdomains).map(([sub,info])=>{
        const val = (info.raw==null) ? "--" : info.raw;
        return `<li>${escapeHTML(sub)}: ${val}${info.notes? " — "+escapeHTML(info.notes):""}</li>`;
      }).join('');
      const badge = v.index!=null ? `${v.index} (${v.severity})` : "—";
      return `<div class="card p-8 mb-8">
        <div><b>${escapeHTML(g.replace(/_/g,' '))}</b> — Index: ${badge}</div>
        <ul>${subs}</ul>
      </div>`;
    }).join('');
    host.innerHTML = cards || "<p class='muted'>No ratings yet.</p>";
  }
  // Collect results without painting/saving (for AI payload)
  window.__OTCore_collect = function(){
    const selects = Array.from(document.querySelectorAll('.otcore-rate'));
    const noteMap = Array.from(document.querySelectorAll('.otcore-notes'))
      .reduce((acc,el)=>{ acc[el.dataset.for]=el.value.trim(); return acc; },{});

    const groups = {};
    const agg = {};
    selects.forEach(sel=>{
      const g = sel.dataset.group;
      const sub = sel.dataset.sub;
      const v = sel.value === "" ? null : Number(sel.value);
      groups[g] = groups[g] || {};
      groups[g][sub] = { raw: v, notes: noteMap[sel.id] || "" };
      if(v!=null){
        agg[g] = agg[g] || { sum:0, n:0 };
        agg[g].sum += v;
        agg[g].n += 1;
      }
    });

    const results = {};
    Object.keys(groups).forEach(g=>{
      const n = agg[g]?.n || 0;
      const sum = agg[g]?.sum || 0;
      const avg = n ? (sum / n) : null;                 // 0–4
      const index = avg!=null ? Math.round(avg * 25) : null;  // 0–100
      results[g] = {
        subdomains: groups[g],
        average: avg,
        index,
        severity: (function(i){
          if(i==null) return "";
          if(i >= 75) return "Typical";
          if(i >= 60) return "Mild Difficulty";
          if(i >= 40) return "Moderate Difficulty";
          return "Severe Difficulty";
        })(index)
      };
    });

    return results;
  };

  // public init
  window.__OTCore_init = function(){
    if(document.getElementById('ot-core-form')){
      renderOTCoreForm();
    }
  };

})();
/* ======================= OT Narrative (independent) ======================= */

// Helper getters
function _textVal(id){ const el = document.getElementById(id); return el ? el.value.trim() : ""; }
function _checkedVals(name){
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
}
function _radioVal(name){
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}

// Build a self-contained OT payload (no ADIR required)
function buildOTNarrativeData(){
  // Try include demographics if available (safe fallback to null)
  const maybeClient =
    (window.generatedReportData && (window.generatedReportData.client || window.generatedReportData.clientInfo))
    || null;
    // Fallback demographics from the visible form (so OT reports can stand alone)
const fn = _textVal("firstName");
const mn = _textVal("middleName");
const ln = _textVal("lastName");
const fullNameFallback = [fn, mn, ln].filter(Boolean).join(" ").trim();
const dobFallback  = _textVal("dobGregorian");
const ageFallback  = _textVal("age");
const genderRaw    = document.getElementById("gender")?.value || "";
const genderFallback = (genderRaw === "other" ? _textVal("genderOtherField") : genderRaw);

// Try to pull intake snapshot (for independent OT)
let intakeSnap = null;
try {
  const caseDoc = (typeof getCurrentCaseDoc === 'function') ? getCurrentCaseDoc() : null;
  intakeSnap = caseDoc?.otAssessment?.fromIntakeSnapshot || caseDoc?.intake?.client || null;
} catch(_e){}

// Normalize to ADIR-like clientInfo so rendering & AI can reuse it
const clientInfo = {
  fullName: intakeSnap?.name || maybeClient?.fullName || fullNameFallback || "",
  dob: intakeSnap?.dob || maybeClient?.dob || dobFallback || "",
  age: (intakeSnap?.ageYears ?? maybeClient?.age) ?? ageFallback ?? "",
  gender: intakeSnap?.sex || maybeClient?.gender || genderFallback || "",
  languages: Array.isArray(intakeSnap?.languages) ? intakeSnap.languages
           : (Array.isArray(maybeClient?.languages) ? maybeClient.languages : (maybeClient?.languages || "")),
  educationPlacement: intakeSnap?.educationPlacement || "",
  diagnoses: Array.isArray(intakeSnap?.diagnoses) ? intakeSnap.diagnoses
           : (maybeClient?.diagnoses || ""),
  reportDate: new Date().toLocaleDateString()
};
// ---- ADIR Background/History collector (for independent OT reports)
function textOrNull(x){ return (typeof x === 'string' && x.trim()) ? x.trim() : null; }

// If the last payload in memory is ADIR, we can use it directly
const adirPayload =
  (window.generatedReportData &&
   window.generatedReportData.meta &&
   String(window.generatedReportData.meta.reportType).toUpperCase() === 'ADIR')
    ? window.generatedReportData
    : null;

let adirBg = null;
try {
  const caseDoc = (typeof getCurrentCaseDoc === 'function') ? getCurrentCaseDoc() : null;
  const intake  = caseDoc?.intake || {};    // intake object if available

  adirBg = {
    demographicSummary:
      textOrNull(adirPayload?.demographicSummary) ||
      textOrNull(intake?.background?.demographicSummary) ||
      null,

    backgroundBirth:
      textOrNull(adirPayload?.backgroundAndBirthHistory) ||
      textOrNull(intake?.background?.birthHistory) ||
      null,

    medicalDevelopmental:
      textOrNull(adirPayload?.medicalAndDevelopmentalHistory) ||
      textOrNull(intake?.medical?.narrative) ||
      null,

    developmentalBehavioral:
      textOrNull(adirPayload?.developmentalAndBehavioralHistory) ||
      textOrNull(intake?.developmental?.narrative) ||
      null,

    education:
      textOrNull(adirPayload?.educationHistory) ||
      textOrNull(intake?.education?.narrative) ||
      null,

    family:
      textOrNull(adirPayload?.familyHistory) ||
      textOrNull(intake?.background?.familyHistory) ||
      null,

    living:
      textOrNull(adirPayload?.livingSituation) ||
      textOrNull(intake?.background?.livingSituation) ||
      null,

    primaryConcerns:
      textOrNull(adirPayload?.primaryConcerns) ||
      (Array.isArray(intake?.concerns?.primary) ? intake.concerns.primary.join(', ') :
       textOrNull(intake?.concerns?.narrative)) ||
      null
  };

  // If everything is null/empty, drop the object
  if (Object.values(adirBg).every(v => !v)) adirBg = null;
} catch(_e) {
  adirBg = null;
}
// ---- Fallback: build minimal ADIR background directly from the form
if (!adirBg) {
  const plang     = _textVal('primaryLanguage');
  const secLangs  = _textVal('secondaryLanguages');
  const exposure  = _textVal('languageExposure');
  const marital   = document.getElementById('parentMaritalStatus')?.value || '';
  const guardian1 = _textVal('household1');               // primary guardian name
  const concerns  = _textVal('primaryConcerns');
  const outcomes  = _textVal('desiredOutcomes');
  const weekday   = _textVal('weekdaySchedule');
  const weekend   = _textVal('weekendSchedule');

  // Build short paragraphs only if we have something to say
  const demoParts = [];
  if (plang)    demoParts.push(`Primary language: ${plang}`);
  if (secLangs) demoParts.push(`Secondary languages: ${secLangs}`);
  if (exposure) demoParts.push(`Exposure to secondary languages: ${exposure}%`);
  if (marital)  demoParts.push(`Parents' marital status: ${marital}`);

  const bgParts = [];
  if (guardian1) bgParts.push(`Primary household guardian: ${guardian1}`);
  if (concerns)  bgParts.push(`Primary concerns: ${concerns}`);
  if (outcomes)  bgParts.push(`Desired outcomes: ${outcomes}`);
  if (weekday || weekend) {
    bgParts.push(
      `Routines${weekday ? ` — weekday: ${weekday}` : ''}${weekend ? `; weekend: ${weekend}` : ''}`
    );
  }

  adirBg = {
    demographicSummary: demoParts.length ? demoParts.join('. ') + '.' : null,
    backgroundBirth: null,
    medicalDevelopmental: null,
    developmentalBehavioral: null,
    education: null,
    family: null,
    living: null,
    primaryConcerns: (concerns || outcomes) ? (concerns || outcomes) : null
  };

  // Enrich the Background & Referral Context paragraph if we assembled pieces
  const merged = bgParts.length ? bgParts.join('. ') + '.' : null;
  if (merged) adirBg.backgroundBirth = merged;  // we’ll fold this into Background & Referral Context in the prompt
}


  // Unified OT Core indices
  const otCore = (window.__OTCore_collect ? window.__OTCore_collect() : null);

  // Caregiver interview / environments
  const envs = _checkedVals("ot_env[]");
  const supports = _checkedVals("ot_supports[]");
  const goalDomains = _checkedVals("ot_goals[]");

  // Expanded sections (from CAAT-OT Expanded)
  const expanded = (window.__OTX_collect ? window.__OTX_collect() : null);

  // Clinical observations radios
  const obs = {
    attention:  (document.querySelector('input[name="ot_obs_attention"]:checked')?.value || ""),
    transitions:(document.querySelector('input[name="ot_obs_transitions"]:checked')?.value || ""),
    imitation:  (document.querySelector('input[name="ot_obs_imitation"]:checked')?.value || ""),
    bilateral:  (document.querySelector('input[name="ot_obs_bilateral"]:checked')?.value || ""),
    oneStep:    (document.querySelector('input[name="ot_obs_1step"]:checked')?.value || ""),
    twoStep:    (document.querySelector('input[name="ot_obs_2step"]:checked')?.value || ""),
    notes: _textVal("ot_obs_notes")
  };

  // Plan
  const plan = {
    frequencyPerWeek: _textVal("ot_freq_per_week"),
    minutesPerSession: _textVal("ot_minutes_per_session"),
    setting: _textVal("ot_setting"),
    supportsSelected: supports,
    supportsNotes: _textVal("ot_supports_notes")
  };

  // Summary / strengths / barriers
  const summary = _textVal("ot_summary");
  const strengths = _textVal("ot_strengths").split("\n").map(s=>s.trim()).filter(Boolean);
  const barriers  = _textVal("ot_barriers").split("\n").map(s=>s.trim()).filter(Boolean);

  // Final payload (independent OT)
  const payload = {
    meta: { reportType: "OT", module: "CAAT-OT v1" },
    client: maybeClient,
    clientInfo,                        // ← NEW (normalized demographics)
    fromIntakeSnapshot: intakeSnap,    // ← NEW (raw intake snapshot if present)
      adirBackground: adirBg,   // <— add this line

    caregiverInterview: {
      primaryConcerns: _textVal("ot_primaryConcerns"),
      environments: envs,
      caregiverNotes: _textVal("ot_caregiverNotes")
    },
    profile:     expanded?.profile     || null,   // routines
    feeding:     expanded?.feeding     || null,   // feeding/oral
    executive:   expanded?.executive   || null,   // exec/self-reg
    handwriting: expanded?.handwriting || null,   // handwriting/school
    safety:      expanded?.safety      || null,   // risk/safety
    copm:        expanded?.copm        || [],     // COPM priorities
    gas:         expanded?.gas         || [],     // GAS goals
    otCore,                                        // unified indices (Sensory, Motor Fine/Gross, ADL, Adaptive)
    clinicalObservations: obs,
    strengths,
    barriers,
    goalsRequested: goalDomains,
    plan,
    summary
  };

  return payload;
}


// Call your existing AI generator but with OT-only data
async function generateOTNarrativeDirect(){
  // Put OT payload where your generator already reads from
  window.generatedReportData = buildOTNarrativeData();

  // Reuse your existing function (same pipeline, OT-specific payload)
  // If your generator supports a template key, you can pass it here; otherwise it will
  // infer from payload.meta.reportType === 'OT'.
  await generateAIReportDirect();

  // If you have a hideLoading() call, add it here
  if (typeof hideLoading === "function") hideLoading();
}
/* ======================= CAAT-OT Expanded (COPM + GAS + collectors) ======================= */
(function(){

  // Helpers (reuse your existing ones if present)
  function $(id){ return document.getElementById(id); }
  function _textVal(id){ const el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function _checkedVals(name){ return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value); }

  // ---------- COPM table ----------
  function copmRowTemplate(data){
    const d = data || { problem:"", importance:"", performance:"", satisfaction:"", notes:"" };
    return `
      <tr>
        <td><input class="ot_copm_problem" placeholder="e.g., Dressing independently" value="${escapeHTML(d.problem||"")}"></td>
        <td><input class="ot_copm_imp" type="number" min="1" max="10" value="${escapeHTML(d.importance||"")}"></td>
        <td><input class="ot_copm_perf" type="number" min="1" max="10" value="${escapeHTML(d.performance||"")}"></td>
        <td><input class="ot_copm_sat"  type="number" min="1" max="10" value="${escapeHTML(d.satisfaction||"")}"></td>
        <td><input class="ot_copm_notes" value="${escapeHTML(d.notes||"")}"></td>
        <td><button type="button" class="btn danger ot_copm_del">X</button></td>
      </tr>`;
  }

  function addCopmRow(data){
    const body = document.querySelector('#ot_copm_table tbody');
    if(!body) return;
    body.insertAdjacentHTML('beforeend', copmRowTemplate(data));
  }

  function collectCOPM(){
    const rows = Array.from(document.querySelectorAll('#ot_copm_table tbody tr'));
    return rows.map(tr => ({
      problem: tr.querySelector('.ot_copm_problem')?.value.trim() || "",
      importance: numOrNull(tr.querySelector('.ot_copm_imp')?.value),
      performance: numOrNull(tr.querySelector('.ot_copm_perf')?.value),
      satisfaction: numOrNull(tr.querySelector('.ot_copm_sat')?.value),
      notes: tr.querySelector('.ot_copm_notes')?.value.trim() || ""
    })).filter(r => r.problem || r.notes);
  }

  // ---------- GAS table ----------
  function gasRowTemplate(data){
    const d = data || { area:"", statement:"", m2:"", m1:"", p0:"", p1:"", p2:"", weeks:"" };
    return `
      <tr>
        <td><input class="ot_gas_area" placeholder="e.g., ADL — Dressing" value="${escapeHTML(d.area||"")}"></td>
        <td><input class="ot_gas_stmt" placeholder="Goal statement" value="${escapeHTML(d.statement||"")}"></td>
        <td><input class="ot_gas_m2" placeholder="-2 (baseline)" value="${escapeHTML(d.m2||"")}"></td>
        <td><input class="ot_gas_m1" placeholder="-1" value="${escapeHTML(d.m1||"")}"></td>
        <td><input class="ot_gas_p0" placeholder="0 (expected)" value="${escapeHTML(d.p0||"")}"></td>
        <td><input class="ot_gas_p1" placeholder="+1" value="${escapeHTML(d.p1||"")}"></td>
        <td><input class="ot_gas_p2" placeholder="+2" value="${escapeHTML(d.p2||"")}"></td>
        <td><input class="ot_gas_weeks" type="number" min="0" placeholder="weeks" value="${escapeHTML(d.weeks||"")}"></td>
        <td><button type="button" class="btn danger ot_gas_del">X</button></td>
      </tr>`;
  }

  function addGasRow(data){
    const body = document.querySelector('#ot_gas_table tbody');
    if(!body) return;
    body.insertAdjacentHTML('beforeend', gasRowTemplate(data));
  }

  function collectGAS(){
    const rows = Array.from(document.querySelectorAll('#ot_gas_table tbody tr'));
    return rows.map(tr => ({
      area: tr.querySelector('.ot_gas_area')?.value.trim() || "",
      statement: tr.querySelector('.ot_gas_stmt')?.value.trim() || "",
      levels: {
        "-2": tr.querySelector('.ot_gas_m2')?.value.trim() || "",
        "-1": tr.querySelector('.ot_gas_m1')?.value.trim() || "",
        "0":  tr.querySelector('.ot_gas_p0')?.value.trim() || "",
        "+1": tr.querySelector('.ot_gas_p1')?.value.trim() || "",
        "+2": tr.querySelector('.ot_gas_p2')?.value.trim() || ""
      },
      timeframeWeeks: numOrNull(tr.querySelector('.ot_gas_weeks')?.value)
    })).filter(r => r.area || r.statement);
  }

  // ---------- Executive, Handwriting, Routines, Feeding, Safety ----------
  function collectExecutive(){
    return {
      attention:      valSel('ot_exec_attention'),      attentionNotes: _textVal('ot_exec_attention_notes'),
      initiation:     valSel('ot_exec_initiation'),     initiationNotes: _textVal('ot_exec_initiation_notes'),
      sustained:      valSel('ot_exec_sustained'),      sustainedNotes: _textVal('ot_exec_sustained_notes'),
      flexibility:    valSel('ot_exec_flex'),           flexibilityNotes: _textVal('ot_exec_flex_notes'),
      workingMemory:  valSel('ot_exec_workmem'),        workingMemoryNotes: _textVal('ot_exec_workmem_notes'),
      planningOrg:    valSel('ot_exec_planorg'),        planningOrgNotes: _textVal('ot_exec_planorg_notes'),
      emotionalReg:   valSel('ot_exec_emoreg'),         emotionalRegNotes: _textVal('ot_exec_emoreg_notes'),
      sensoryReg:     valSel('ot_exec_sensreg'),        sensoryRegNotes: _textVal('ot_exec_sensreg_notes')
    };
  }

  function collectHandwriting(){
    return {
      letter:    valSel('ot_hw_letter'),
      spacing:   valSel('ot_hw_spacing'),
      speed:     valSel('ot_hw_speed'),
      copy:      valSel('ot_hw_copy'),
      keyboard:  valSel('ot_hw_keyboard'),
      accomm:    _textVal('ot_hw_accomm'),
      schoolNotes: _textVal('ot_school_notes')
    };
  }

  function collectRoutines(){
    return {
      morning:   _textVal('ot_routine_morning'),
      school:    _textVal('ot_routine_school'),
      after:     _textVal('ot_routine_after'),
      bedtime:   _textVal('ot_routine_bedtime'),
      challenges: _textVal('ot_routine_challenges').split('\n').map(s=>s.trim()).filter(Boolean)
    };
  }

  function collectFeeding(){
    return {
      appetite: valSel('ot_feed_appetite'),
      texture:  valSel('ot_feed_texture'),
      chewing:  valSel('ot_feed_chew'),
      flags: {
        picky:      $('#ot_feed_picky')?.checked || false,
        gagging:    $('#ot_feed_gag')?.checked || false,
        choking:    $('#ot_feed_choke')?.checked || false,
        oralSeeking:$('#ot_feed_oralseek')?.checked || false,
        arfid:      $('#ot_feed_arfid')?.checked || false
      },
      notes: _textVal('ot_feed_notes')
    };
  }

  function collectSafety(){
    return {
      risks: _checkedVals('ot_risk[]'),
      notes: _textVal('ot_risk_notes')
    };
  }

  // ---------- init / events ----------
  function initCOPM(){
    const addBtn = $('#ot_copm_add');
    const table = $('#ot_copm_table');
    if(!addBtn || !table) return;
    addBtn.addEventListener('click', ()=> addCopmRow());
    table.addEventListener('click', (e)=>{
      if(e.target && e.target.classList.contains('ot_copm_del')){
        e.target.closest('tr')?.remove();
      }
    });
    // seed one empty row
    if(!table.querySelector('tbody tr')) addCopmRow();
  }

  function initGAS(){
    const addBtn = $('#ot_gas_add');
    const table = $('#ot_gas_table');
    if(!addBtn || !table) return;
    addBtn.addEventListener('click', ()=> addGasRow());
    table.addEventListener('click', (e)=>{
      if(e.target && e.target.classList.contains('ot_gas_del')){
        e.target.closest('tr')?.remove();
      }
    });
    // seed one empty row
    if(!table.querySelector('tbody tr')) addGasRow();
  }

  function valSel(id){
    const el = document.getElementById(id);
    if(!el) return "";
    const v = (el.value ?? "").toString().trim();
    return v;
  }

  function numOrNull(v){
    if(v===undefined || v===null) return null;
    const s = (""+v).trim();
    if(s==="") return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }

  function escapeHTML(s){ return (s??"").toString().replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m])); }

  // expose init + collector
  window.__OTX_init = function(){
    initCOPM();
    initGAS();
  };

  window.__OTX_collect = function(){
    return {
      profile:     collectRoutines(),
      feeding:     collectFeeding(),
      executive:   collectExecutive(),
      handwriting: collectHandwriting(),
      safety:      collectSafety(),
      copm:        collectCOPM(),
      gas:         collectGAS()
    };
  };

})();




