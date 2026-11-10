/* Read-only primary/secondary muscle map copied from SpartanX's
 * original exercise library. Keep in sync with index.html muscleProfiles.
 * Use only for workload attribution, never as a fatigue diagnosis. */
(function(global){
 'use strict';
const muscleProfiles=[["Back Squat|Pause Squat|Tempo Squat|Smith Machine Squat","quads,glutes","adductors,hamstrings,core,back"],["Front Squat|Goblet Squat","quads,glutes","adductors,core,back"],["Box Squat|Safety Bar Squat","glutes,quads","hamstrings,adductors,core,back"],["Hack Squat|Leg Press|Single-Leg Leg Press","quads,glutes","adductors"],["Leg Extension|Single-Leg Leg Extension","quads",""],["Bulgarian Split Squat|Reverse Lunge|Walking Lunge|Step-Up","quads,glutes,adductors","hamstrings,core,calves"],["Single-Leg Romanian Deadlift|Romanian Deadlift|Stiff-Leg Deadlift","hamstrings,glutes,back","adductors,traps,forearms,core"],["Deadlift|Conventional Deadlift|Deficit Deadlift","glutes,back,quads","hamstrings,adductors,traps,forearms,core"],["Sumo Deadlift","glutes,quads,adductors","hamstrings,back,traps,forearms,core"],["Trap Bar Deadlift","quads,glutes,back","hamstrings,adductors,traps,forearms,core"],["Hip Thrust|Single-Leg Hip Thrust|Glute Bridge","glutes","hamstrings,adductors,core"],["Cable Kickback","glutes","core"],["Lying Leg Curl|Seated Leg Curl|Single-Leg Curl","hamstrings","calves"],["Standing Calf Raise|Seated Calf Raise","calves",""],["Bench Press|Paused Bench Press|Dumbbell Chest Press|Flat Dumbbell Press|Single-Arm Dumbbell Chest Press","chest,triceps","shoulders,core"],["Machine Chest Press|Single-Arm Machine Chest Press","chest,triceps","shoulders"],["Push-Up","chest,triceps","shoulders,core"],["Close-Grip Bench Press","triceps,chest","shoulders"],["Incline Barbell Bench Press|Incline Dumbbell Chest Press|Incline Dumbbell Press","chest,triceps","shoulders,core"],["Decline Bench Press|Decline Dumbbell Press","chest,triceps","shoulders"],["Weighted Dip","chest,triceps","shoulders"],["Chest Fly|Dumbbell Fly|Incline Dumbbell Fly|Cable Crossover|Single-Arm Cable Fly","chest","shoulders,core"],["Overhead Press","shoulders,triceps","traps,core"],["Seated Barbell Shoulder Press|Seated Dumbbell Shoulder Press|Single-Arm Dumbbell Shoulder Press|Arnold Press","shoulders,triceps","traps,core"],["Machine Shoulder Press","shoulders,triceps","traps"],["Lateral Raise|Dumbbell Lateral Raise|Cable Lateral Raise|Single-Arm Cable Lateral Raise","shoulders","traps"],["Rear Delt Fly|Reverse Pec Deck","shoulders","back,traps"],["Face Pull","shoulders,back","traps,biceps"],["Upright Row","shoulders,traps","biceps,forearms"],["Barbell Row|Pendlay Row|Dumbbell Row|Single-Arm Dumbbell Row","back","biceps,traps,shoulders,forearms,core"],["Chest-Supported Row|Seated Cable Row|Single-Arm Cable Row|Wide-Grip Seated Cable Row|Machine High Row|Single-Arm Machine Row","back","biceps,shoulders,traps,forearms"],["Lat Pulldown|Close-Grip Lat Pulldown|Single-Arm Lat Pulldown","back","biceps,shoulders,forearms,traps"],["Pull-Up|Chin-Up|Assisted Pull-Up","back,biceps","forearms,shoulders,core,traps"],["Straight-Arm Pulldown","back","shoulders,core"],["Barbell Curl|Dumbbell Curl|Alternating Dumbbell Curl|Single-Arm Cable Curl|Preacher Curl|Single-Arm Preacher Curl|Cable Curl|EZ-Bar Curl|Concentration Curl","biceps","forearms"],["Hammer Curl|Cross-Body Hammer Curl","biceps,forearms",""],["Triceps Pushdown|Single-Arm Triceps Pushdown","triceps",""],["Overhead Triceps Extension|Single-Arm Overhead Triceps Extension|Skull Crusher|Dumbbell Skull Crusher","triceps","shoulders"],["Close-Grip Push-Up","triceps,chest","shoulders,core"],["Bench Dip","triceps,chest","shoulders"],["Ab Wheel","core","shoulders,back"],["Cable Crunch","core",""],["Decline Sit-Up","core","hip_flexors"],["Hanging Knee Raise|Hanging Leg Raise","core,hip_flexors","forearms,back"],["Plank","core","shoulders,glutes,back"],["Side Plank","core","shoulders,glutes"],["Pallof Press","core","shoulders"],["Single-Arm Farmer Carry|Farmer Carry","forearms,core,traps,glutes","quads,calves,shoulders,back"]];
const muscleMap=Object.fromEntries(muscleProfiles.flatMap(([names,primary,secondary])=>
 names.split('|').map(name=>[name,{primary:primary.split(',').filter(Boolean),secondary:secondary.split(',').filter(Boolean)}])
));
const normalizeExerciseName=name=>String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const muscleAliases={
 deadlift:'Deadlift','barbell deadlift':'Deadlift','conventional barbell deadlift':'Conventional Deadlift',
 squat:'Back Squat','barbell squat':'Back Squat','barbell back squat':'Back Squat',
 bench:'Bench Press','barbell bench press':'Bench Press','benchpress':'Bench Press',
 ohp:'Overhead Press','military press':'Overhead Press','standing overhead press':'Overhead Press',
 'barbell overhead press':'Overhead Press','shoulder press':'Overhead Press',
 'barbell romanian deadlift':'Romanian Deadlift','dumbbell romanian deadlift':'Romanian Deadlift',
 'romanian deadlift barbell':'Romanian Deadlift','hex bar deadlift':'Trap Bar Deadlift',
 'trapbar deadlift':'Trap Bar Deadlift','sumo barbell deadlift':'Sumo Deadlift'
};

 const normalizedMuscleNames=new Map(Object.keys(muscleMap).map(name=>[normalizeExerciseName(name),name]));
 const TARGETS={quads:'Quads',glutes:'Glutes',hamstrings:'Hamstrings',
  adductors:'Adductors',calves:'Calves',chest:'Chest',back:'Back',
  shoulders:'Shoulders',traps:'Traps',biceps:'Biceps',triceps:'Triceps',
  forearms:'Forearms',core:'Core',hip_flexors:'Hip flexors'};
 function muscles(name){
  const key=normalizeExerciseName(name);
  const canonical=muscleAliases[key]||normalizedMuscleNames.get(key);
  const result=canonical?muscleMap[canonical]:null;
  return result?{primary:[...result.primary],secondary:[...result.secondary]}:{primary:[],secondary:[]};
 }
 function primaryGroup(name){
  const result=muscles(name);
  const first=result.primary[0];
  return first?TARGETS[first]||null:null;
 }
 global.SXMuscleLibrary=Object.freeze({muscles,primaryGroup});
})(window);