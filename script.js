// ✅ Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHs0w6x1nBJ0TSydIgb8Hh3CjjJHTKVow",
  authDomain: "caat-tool.firebaseapp.com",
  projectId: "caat-tool",
  storageBucket: "caat-tool.firebasestorage.app",
  messagingSenderId: "877587046757",
  appId: "1:877587046757:web:e825ad4f018cc8315a418c"
};

// ✅ Initialize Firebase
firebase.initializeApp(firebaseConfig);

// ✅ Confirm this script loaded (DevTools)
console.log("✅ script.js loaded");



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

document.addEventListener("DOMContentLoaded", () => {
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

  const tabs = document.querySelectorAll(".tab");
  const containers = document.querySelectorAll(".container");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.getAttribute("data-tab");
      tabs.forEach((t) => t.classList.remove("active"));
      containers.forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      const target = document.getElementById(tabId);
      if (target) target.classList.add("active");
    });
  });

  // ✅ Delivery mode logic
  const deliveryRadios = document.querySelectorAll('input[name="deliveryMode"]');
  deliveryRadios.forEach(radio => {
    radio.addEventListener("change", () => {
      const selected = document.querySelector('input[name="deliveryMode"]:checked')?.value;
      toggleDisplay("csectionReasonWrapper", selected === "c-section");
      toggleDisplay("otherDeliveryWrapper", selected === "other");
    
  });
}); // ✅ Final closing of DOMContentLoaded


  const firstVisibleTab = Array.from(tabs).find((tab) => {
    const tabId = tab.getAttribute("data-tab");
    return document.getElementById(tabId);
  });
  const firstVisibleContainer = Array.from(containers).find((container) => {
    return Array.from(tabs).some((tab) => tab.getAttribute("data-tab") === container.id);
  });

  if (firstVisibleTab && firstVisibleContainer) {
    firstVisibleTab.classList.add("active");
    firstVisibleContainer.classList.add("active");
  }
});

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
  currentLanguage = lang;
  document.body.dir = lang === "ar" ? "rtl" : "ltr";
  document.body.classList.toggle("rtl", lang === "ar");

  

  const signBtn = document.querySelector('button[onclick="generateFullIntakeReport()"]');
if (signBtn) signBtn.textContent = translations[lang].signSubmit;

const aiBtn = document.querySelector('button[onclick="generateNarrativeReport()"]');
if (aiBtn) aiBtn.textContent = translations[lang].generateAI;

const langLabel = document.querySelector('label[for="languageSelect"]');
if (langLabel) langLabel.textContent = translations[lang].selectLanguage;

  // ✅ Add this at the end
  // ✅ Translate form labels
// ✅ Translate form labels
 document.querySelectorAll("[data-translate]").forEach((el) => {
  const key = el.getAttribute("data-translate");
  console.log("Translating:", key, "→", translations[currentLanguage][key]); // 👈 add this
  if (translations[currentLanguage][key]) {
    el.textContent = translations[currentLanguage][key];
  }
});


  // ✅ Translate <option> elements
  document.querySelectorAll("option[data-translate-option]").forEach((opt) => {
    const key = opt.getAttribute("data-translate-option");
    if (translations[currentLanguage][key]) {
      opt.textContent = translations[currentLanguage][key];
      opt.label = translations[currentLanguage][key];
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
let doc = "";

  const get = (id) => document.getElementById(id)?.value.trim() || "";
  const today = new Date().toLocaleDateString();

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
const handPreference = get("handPreference");
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
  }
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
      American Autism Council | https://americanautismcouncil.org<br>
      2870 E Oakland Park Blvd, Fort Lauderdale, FL 33306
    </div>
  `; 

  doc += `
  <div class="header" style="text-align: center; border-bottom: 1px solid #ccc; padding: 10px 0; background: white;">
  <img src="https://i.postimg.cc/TPNDd6ZD/aac-logo.png" style="height: 60px; display: block; margin: 0 auto;" alt="AAC Logo">
  <div style="font-size: 14px; color: #1a3e80; font-weight: bold;">
    AMERICAN AUTISM COUNCIL FOR ACCREDITATION AND CONTINUING EDUCATION
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
    <h2>${translations[currentLanguage].demographicSummary}</h2>
    <ul>
      <li><strong>${translations[currentLanguage].fullNameLabel}:</strong> ${childFullName}</li>
  <li><strong>${translations[currentLanguage].preferredNameLabel}:</strong> ${preferredName || "N/A"}</li>
  <li><strong>${translations[currentLanguage].ageLabel}:</strong> ${age}</li>
  <li><strong>${translations[currentLanguage].genderLabel}:</strong> ${gender}</li>
  <li><strong>${translations[currentLanguage].dobLabel}:</strong> ${dob || "unspecified"}</li>
  <li><strong>${translations[currentLanguage].primaryLangLabel}:</strong> ${primaryLanguage}${languageOther ? ` (${languageOther})` : ""}</li>
  <li><strong>${translations[currentLanguage].secondaryLangLabel}:</strong> ${secondaryLanguages || "None reported"}</li>
  <li><strong>${translations[currentLanguage].maritalStatusLabel}:</strong> ${parentMaritalStatus}${maritalOther ? ` (${maritalOther})` : ""}</li>
  <li><strong>${translations[currentLanguage].extendedFamilyLabel}:</strong> ${extendedFamilyInvolvement || "Not reported"}</li>
  <li><strong>${translations[currentLanguage].household1Label}:</strong> ${household1Name || "Not specified"}</li>
  <li><strong>${translations[currentLanguage].residence1Label}:</strong> ${residence1 || "Not specified"}%</li>
  <li><strong>${translations[currentLanguage].household1MembersLabel}:</strong><br/>
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
  <li><strong>${translations[currentLanguage].household2Label}:</strong> ${household2Name}</li>
  <li><strong>${translations[currentLanguage].residence2Label}:</strong> ${residence2 || "Not specified"}%</li>
  <li><strong>${translations[currentLanguage].household2MembersLabel}:</strong><br/>
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
      ? `<li><strong>${translations[currentLanguage].siblingsLabel}:</strong><br/>
        ${siblingNames.map((n, i) => `- ${n} (age ${siblingAges[i] || "?"})`).join("<br/>")}
      </li>`
      : ""
  }
  <li><strong>${translations[currentLanguage].primaryConcernsLabel}:</strong> ${primaryConcerns || "Not provided"}</li>
  <li><strong>${translations[currentLanguage].desiredOutcomesLabel}:</strong> ${desiredOutcomes || "Not specified"}</li>
  ${additionalNotes ? `<li><strong>${translations[currentLanguage].additionalNotesLabel}:</strong> ${additionalNotes}</li>` : ""}
`;
doc += `
  <div class="section">
    <h2>${translations[currentLanguage].backgroundHistory}</h2>
    <ul>
      <li><strong>${translations[currentLanguage].motherAgeLabel}:</strong> ${motherAgeAtBirth || "unspecified"}</li>
<li><strong>${translations[currentLanguage].fatherAgeLabel}:</strong> ${fatherAgeAtBirth || "unspecified"}</li>
<li><strong>${translations[currentLanguage].consanguinityLabel}:</strong> ${degreeOfConsanguinity || "not specified"}</li>
<li><strong>${translations[currentLanguage].motherEduLabel}:</strong> ${motherOccEdu || "not provided"}</li>
<li><strong>${translations[currentLanguage].fatherEduLabel}:</strong> ${fatherOccEdu || "not provided"}</li>
<li><strong>${translations[currentLanguage].pregnancyCountLabel}:</strong> ${numMotherPregnancies || "unspecified"}</li>
<li><strong>${translations[currentLanguage].liveBirthsLabel}:</strong> ${liveBirths || "?"}</li>
<li><strong>${translations[currentLanguage].stillBirthsLabel}:</strong> ${stillBirths || "0"}</li>
<li><strong>${translations[currentLanguage].pregnancyPlannedLabel}:</strong> ${pregnancyPlanned || "unspecified"}</li>
<li><strong>${translations[currentLanguage].fertilityLabel}:</strong> ${fertilityTreatments || "not mentioned"}</li>
<li><strong>${translations[currentLanguage].medicationsLabel}:</strong> ${tookMedicationsYesNo === "yes" ? (pregMedications.join(", ") || "none listed") + (pregMedOther ? `, and also: ${pregMedOther}` : "") : "None reported"}</li>
<li><strong>${translations[currentLanguage].multipleBirthLabel}:</strong> ${multipleBirthNew === "yes" ? `${multipleBirthType || "unspecified type"}, ${identicalOrFraternal || "unspecified"}` : "No"}</li>
<li><strong>${translations[currentLanguage].drugUseLabel}:</strong> ${pregDrugUsed === "yes" ? pregDrugSpec || "unspecified substances" : "No use reported"}</li>
<li><strong>${translations[currentLanguage].complicationsLabel}:</strong> ${difficultPregYesNo === "yes" ? (pregnancyDifficulties.join(", ") || "unspecified") + `. Notes: ${pregDiffExplain || "none"}` : "None reported"}</li>
<li><strong>${translations[currentLanguage].pitocinLabel}:</strong> ${pitocinUsedNew || "not reported"}</li>
<li><strong>${translations[currentLanguage].deliveryLabel}:</strong> ${deliveryMode || "unspecified"}${deliveryMode === "c-section" && csectionReasonNew ? ` (Reason: ${csectionReasonNew})` : ""}</li>
<li><strong>${translations[currentLanguage].prematureLabel}:</strong> 
  ${prematureBirthNew === "yes"
    ? `Yes${prematureWeeksNew ? ` – ${prematureWeeksNew} weeks` : ""}`
    : prematureBirthNew || "Not reported"}
</li>
<li><strong>${translations[currentLanguage].laborCompLabel}:</strong> 
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

<li><strong>${translations[currentLanguage].neonatalCompLabel}:</strong> ${problemsInHospitalYesNo === "yes" ? hospitalProblems.join(", ") || "not specified" : "None"}</li>
<li><strong>${translations[currentLanguage].nicuLabel}:</strong> ${nicuAdmitNew === "yes" ? `Yes (${nicuDischargedDays || "duration unspecified"} days), Reason: ${nicuReasonNew || "not specified"}` : "No"}</li>
    </ul>

    <h3>${translations[currentLanguage].dietaryHeading}</h3>
<ul>
  <li><strong>${translations[currentLanguage].allergiesLabel}:</strong> ${currentAllergies2 === "yes" ? allergiesList2 || "unspecified items" : "No known allergies"}</li>
  <li><strong>${translations[currentLanguage].specialDietLabel}:</strong> ${specialDiet2 === "yes" ? specialDietChecklist.join(", ") || "none specified" : "Not reported"}</li>
</ul>


    <h3>${translations[currentLanguage].milestonesHeading}</h3>
<ul>
  <li><strong>${translations[currentLanguage].socialMilestonesLabel || "Social Milestones"}:</strong><br/>
  ${
    Object.entries(devSocial)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${translations[currentLanguage][k] || k.replace("soc_", "")}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>

  <li><li><strong>${translations[currentLanguage].cognitiveMilestonesLabel || "Cognitive Milestones"}:</strong><br/>
  ${
    Object.entries(devCognitive)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${translations[currentLanguage]["cog_" + k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>

  <li><strong>${translations[currentLanguage].languageMilestonesLabel || "Language Milestones"}:</strong><br/>
  ${
    Object.entries(devLanguage)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${translations[currentLanguage]["lang_" + k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>

  <li><strong>${translations[currentLanguage].physicalMilestonesLabel || "Physical Milestones"}:</strong><br/>
  ${
    Object.entries(devPhysical)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${translations[currentLanguage]["phy_" + k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>
</ul>


    <h3>${translations[currentLanguage].dailyLivingHeading}</h3>
<ul>
  <li><strong>${translations[currentLanguage].groomingLabel}:</strong><br/>
  ${
    Object.entries(devGrooming)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${translations[currentLanguage][k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>
<li><strong>${translations[currentLanguage].feedingLabel}:</strong><br/>
  ${
    Object.entries(devFeeding)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${translations[currentLanguage][k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>
<li><strong>${translations[currentLanguage].dressingLabel}:</strong><br/>
  ${
    Object.entries(devDressing)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${translations[currentLanguage][k] || k}: ${v}`)
      .join(", ") || "Not reported"
  }
</li>
  <li><strong>${translations[currentLanguage].foodSleepLabel}:</strong> ${foodSleepReq2 || "Not described"}</li>
  <li><strong>${translations[currentLanguage].regressionLabel}:</strong> ${lossSkill2 === "yes" ? `Yes. Explanation: ${lossSkillExplain2 || "Not provided"}. Age noticed: ${lossSkillAge2 || "Not specified"}` : "No"}</li>
</ul>


    <h3>${translations[currentLanguage].sensoryHeading}</h3>
<ul>
  <li><strong>${translations[currentLanguage].affectLabel}:</strong> ${affectTraits.join(", ") || "Not specified"}</li>
  <li><strong>${translations[currentLanguage].domainSensoryLabel}:</strong>
    Vision (${sensVision || "n/a"}), Tactile (${sensTactile || "n/a"}), Hearing (${sensHearing || "n/a"}),
    Taste (${sensTaste || "n/a"}), Body Awareness (${sensBodyAwareness || "n/a"}), Smell (${sensSmell || "n/a"}),
    Vestibular (${sensVestibular || "n/a"}), Interoception (${sensInteroception || "n/a"})
  </li>
  <li><strong>${translations[currentLanguage].reactionsLabel}:</strong> ${
    sensReacts.length 
      ? sensReacts.map(item => translations[currentLanguage]["sens" + capitalize(item)] || item).join(", ")
      : (translations[currentLanguage].none || "None observed")
  }</li>
</ul>



    <h3>${translations[currentLanguage].educationHeading}</h3>
<ul>
  <li><strong>${translations[currentLanguage].schoolLabel}:</strong> ${currentSchool === "yes" ? `Yes (${schoolName || "unnamed school"})` : "No"}</li>
  <li><strong>${translations[currentLanguage].gradeLabel}:</strong> ${programGradeLevel || "Not specified"}</li>
  <li><strong>${translations[currentLanguage].attendanceLabel}:</strong> ${attendanceFrequency || "Unspecified"}</li>
  <li><strong>${translations[currentLanguage].accommodationsLabel}:</strong> ${specialServicesAccom === "yes" ? specialServicesType || "unspecified" : "None reported"}</li>
  <li><strong>${translations[currentLanguage].handLabel}:</strong> ${handPreference || "Unspecified"}</li>
  <li><strong>${translations[currentLanguage].repeatedGradesLabel}:</strong> ${gradesRepeated || "Unspecified"}</li>
  <li><strong>${translations[currentLanguage].learningLabel}:</strong> ${learningChallenges === "yes" ? learningChallengesExplain || "Not specified" : "None reported"}</li>
  <li><strong>${translations[currentLanguage].weekdayLabel}:</strong> ${weekdaySchedule || "Not described"}</li>
  <li><strong>${translations[currentLanguage].weekendLabel}:</strong> ${weekendSchedule || "Not described"}</li>
  <li><strong>${translations[currentLanguage].hobbiesLabel}:</strong> ${interestsHobbies || "Not specified"}</li>
  <li><strong>${translations[currentLanguage].strengthsLabel}:</strong> ${patientStrengths || "Not specified"}</li>
</ul>
  </div>
`;
doc += `
  <div class="section">
    <h2>${translations[currentLanguage].behaviorHeading}</h2>
    <ul>
      <li><strong>${translations[currentLanguage].problemBehaviorLabel}:</strong>
        ${problemBehaviors.length
  ? problemBehaviors.map(b => translations[currentLanguage]["pb" + capitalize(b)] || b).join(", ")
  : translations[currentLanguage].none || "None reported"}

      </li>
      <li><strong>${translations[currentLanguage].behaviorObservationLabel}:</strong> ${behaviorConcerns || "Not specified"}</li>
      <li><strong>${translations[currentLanguage].socialFunctioningLabel}:</strong> 
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
      <li><strong>${translations[currentLanguage].traumaLabel}:</strong> ${abuseNeglectHistory || "Unspecified"}
        ${abuseNeglectExplain ? `<br/>Details: ${abuseNeglectExplain}` : ""}
      </li>
      <li><strong>${translations[currentLanguage].stressorsLabel}:</strong> 
        ${recentStressors2 === "yes" ? `Yes – ${explainStressors2 || "Not specified"}` : "None reported"}
      </li>
      ${behaviorAdditionalComments
        ? `<li><strong>${translations[currentLanguage].behaviorNotesLabel}:</strong> ${behaviorAdditionalComments}</li>`
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
    <h2>${translations[currentLanguage].clinicalObservations}</h2>
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
    <h2>${translations[currentLanguage].signatureHeading}</h2>
    <p><strong>${translations[currentLanguage].caseManagerNameLabel}:</strong> ${caseManager || "Not provided"}</p>
    <p><strong>${translations[currentLanguage].caseManagerSignatureLabel}:</strong> ${get("caseManagerSignature") || "Not signed"}</p>
    <p><strong>${translations[currentLanguage].submissionDateLabel}:</strong> ${intakeDate || "Not dated"}</p>
    <p style="margin-top: 30px;">${translations[currentLanguage].confirmationStatement}</p>
  </div>
`;



doc += `
<div id="reportLanguageSelector" style="text-align: center; margin-bottom: 20px;">
  <label style="font-weight: bold;">Select language for AI report:</label><br/>
  <div class="dropdown-wrapper" style="display: inline-block; text-align: left; position: relative; width: 260px;">
    <div class="dropdown-toggle" onclick="toggleLanguageDropdown()" style="padding: 10px; background: #f0f0f0; border: 1px solid #ccc; cursor: pointer;">
      Click to select language(s)
    </div>
    <div class="dropdown-menu" id="languageDropdown" style="display: none; position: absolute; background: white; border: 1px solid #ccc; width: 100%; max-height: 180px; overflow-y: auto; z-index: 1000; padding: 10px;">
      <label><input type="checkbox" name="reportLanguages" value="en" checked> English</label><br>
      <label><input type="checkbox" name="reportLanguages" value="ar"> Arabic</label><br>
      <label><input type="checkbox" name="reportLanguages" value="zh"> Chinese (中文)</label><br>
      <label><input type="checkbox" name="reportLanguages" value="hi"> Hindi (हिन्दी)</label><br>
      <label><input type="checkbox" name="reportLanguages" value="es"> Spanish (Español)</label><br>
      <label><input type="checkbox" name="reportLanguages" value="fr"> French (Français)</label><br>
    </div>
  </div>
</div>

<div style="text-align:center; margin-top:40px;">
  <button onclick="generateNarrativeReport()">AI Generated Diagnostic Report</button>
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
    <h2 style="color: #1a3e80; margin-top: 50px;">${translations[currentLanguage].dsm5Evaluation}</h2>
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

  if (!window.currentUser) {
    alert("You must be logged in to generate an AI report.");
    hideLoading();
    return;
  }

  try {
    await incrementReportCount(window.currentUser.uid, window.currentUser.email);
  } catch (err) {
    alert(err.message);
    hideLoading();
    return;
  }

  const data = window.generatedReportData;
  if (!data) {
    alert("Please generate the full intake report first.");
    hideLoading();
    return;
  }

  const selectedLangs = Array.from(document.querySelectorAll('input[name="reportLanguages"]:checked'))
    .map(cb => cb.value);

  if (selectedLangs.length === 0) {
    alert("Please select at least one language for the AI report.");
    hideLoading();
    return;
  }

  try {
    const response = await fetch("https://caat-backend.onrender.com/generate-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, languages: selectedLangs })
    });

    if (!response.ok) {
      alert("Failed to generate narrative report.");
      hideLoading();
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
              <img src="https://i.postimg.cc/TPNDd6ZD/aac-logo.png" alt="AAC Logo">
              <h2>AMERICAN AUTISM COUNCIL FOR ACCREDITATION AND CONTINUING EDUCATION</h2>
              <h3>Comprehensive Autism Assessment Tool (CAAT)</h3>
            </div>
            <div class="cover-title">Autism Diagnostic Intake Report (ADIR)</div>
            <div class="cover-subtitle">Private and Confidential</div>
            <div class="footer">
              2870 E Oakland Park Blvd Fort Lauderdale, FL 33306 *** info@americanautismcouncil.org *** www.americanautismcouncil.org
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
            <p><strong>Name:</strong> ${data.clientInfo.fullName}</p>
            <p><strong>Date of Birth:</strong> ${data.clientInfo.dob}</p>
            <p><strong>Intake Date:</strong> ${data.clientInfo.intakeDate}</p>
            <p><strong>Age at Assessment:</strong> ${data.clientInfo.age}</p>
            <p><strong>Gender:</strong> ${data.clientInfo.gender}</p>
            <p><strong>Reported By:</strong> ${data.clientInfo.caseManager}</p>
            <p><strong>Date of Report:</strong> ${data.clientInfo.reportDate}</p>

            <div class="footer">
              2870 E Oakland Park Blvd Fort Lauderdale, FL 33306 *** info@americanautismcouncil.org *** www.americanautismcouncil.org
            </div>
          </div>

          <!-- MAIN NARRATIVE REPORT -->
          <div class="narrative-body">
            ${result.report.replace(/\n/g, "<p>$&</p>")} ${evaluateDSM5(data)}
          </div>
        </body>
      </html>
    `);
    newWin.document.close();
  } catch (err) {
    alert("An error occurred while generating the report.");
    console.error(err);
  } finally {
    hideLoading();
  }
}
