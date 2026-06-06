import type { Equipment } from '../types';

export interface ExerciseFormGuide {
  setup: string;
  movement: string;
  breathing: string;
  mistakes: string;
  safety: string;
  easyOption: string;
}

const CURATED: Record<string, ExerciseFormGuide> = {
  'push up': {
    setup: 'Start in a high plank position with hands under your shoulders and body in a straight line from head to heels.',
    movement: 'Lower your chest toward the floor by bending your elbows. Keep your core tight and body straight. Push back up to the start. Do not let your hips sag or pike up.',
    breathing: 'Breathe in as you lower your chest. Breathe out as you push back up.',
    mistakes: 'Letting your hips sag or pike up. Flaring your elbows straight out. Not going through a full range of motion.',
    safety: 'Stop if you feel sharp pain in your shoulders, wrists, or lower back.',
    easyOption: 'Do knee push-ups. Keep your body straight from knees to head and follow the same movement.',
  },
  'push-up': {
    setup: 'Start in a high plank position with hands under your shoulders and body in a straight line from head to heels.',
    movement: 'Lower your chest toward the floor by bending your elbows. Keep your core tight and body straight. Push back up to the start. Do not let your hips sag or pike up.',
    breathing: 'Breathe in as you lower your chest. Breathe out as you push back up.',
    mistakes: 'Letting your hips sag or pike up. Flaring your elbows straight out. Not going through a full range of motion.',
    safety: 'Stop if you feel sharp pain in your shoulders, wrists, or lower back.',
    easyOption: 'Do knee push-ups. Keep your body straight from knees to head and follow the same movement.',
  },
  'plank': {
    setup: 'Place your forearms on the floor with elbows under your shoulders. Extend your legs back and balance on your toes. Body in a straight line from head to heels.',
    movement: 'Hold this position. Squeeze your core, glutes, and thighs. Keep your hips level. Do not let them sag down or push up.',
    breathing: 'Breathe slowly and steadily through your nose. Do not hold your breath.',
    mistakes: 'Letting your hips sag or pike up. Holding your breath. Looking up instead of at the floor.',
    safety: 'Stop if you feel sharp pain in your lower back or shoulders.',
    easyOption: 'Drop your knees to the floor. Keep your body straight from knees to head and hold the position.',
  },
  'dumbbell bicep curl': {
    setup: 'Stand tall with a dumbbell in each hand, arms by your sides, palms facing forward. Keep your elbows close to your torso.',
    movement: 'Bend your elbows to curl the weights up toward your shoulders. Keep your upper arms still. Lower the weights back down with control. Do not swing the weights.',
    breathing: 'Breathe out as you curl the weights up. Breathe in as you lower them down.',
    mistakes: 'Swinging the weights with your body. Moving your upper arms forward. Rushing the lowering phase.',
    safety: 'Stop if you feel sharp pain in your elbows or wrists.',
    easyOption: 'Use lighter dumbbells. Slow down the movement to make the exercise easier and more controlled.',
  },
  'dumbbell curl': {
    setup: 'Stand tall with a dumbbell in each hand, arms by your sides, palms facing forward. Keep your elbows close to your torso.',
    movement: 'Bend your elbows to curl the weights up toward your shoulders. Keep your upper arms still. Lower the weights back down with control. Do not swing the weights.',
    breathing: 'Breathe out as you curl the weights up. Breathe in as you lower them down.',
    mistakes: 'Swinging the weights with your body. Moving your upper arms forward. Rushing the lowering phase.',
    safety: 'Stop if you feel sharp pain in your elbows or wrists.',
    easyOption: 'Use lighter dumbbells. Slow down the movement to make the exercise easier and more controlled.',
  },
  'bicep curl': {
    setup: 'Stand tall with a dumbbell in each hand, arms by your sides, palms facing forward. Keep your elbows close to your torso.',
    movement: 'Bend your elbows to curl the weights up toward your shoulders. Keep your upper arms still. Lower the weights back down with control. Do not swing the weights.',
    breathing: 'Breathe out as you curl the weights up. Breathe in as you lower them down.',
    mistakes: 'Swinging the weights with your body. Moving your upper arms forward. Rushing the lowering phase.',
    safety: 'Stop if you feel sharp pain in your elbows or wrists.',
    easyOption: 'Use lighter dumbbells. Slow down the movement to make the exercise easier and more controlled.',
  },
  'squat': {
    setup: 'Stand with your feet shoulder-width apart, toes slightly turned out. Keep your chest up and core tight.',
    movement: 'Push your hips back and bend your knees to lower down as if sitting in a chair. Go as low as comfortable. Drive through your heels to stand back up. Keep your knees in line with your toes.',
    breathing: 'Breathe in as you lower down. Breathe out as you stand up.',
    mistakes: 'Letting your knees cave inward. Rounding your lower back. Lifting your heels off the floor.',
    safety: 'Stop if you feel sharp pain in your knees, hips, or lower back.',
    easyOption: 'Do a partial squat, only going halfway down. Or hold onto a wall or chair for balance.',
  },
  'bodyweight squat': {
    setup: 'Stand with your feet shoulder-width apart, toes slightly turned out. Keep your chest up and core tight.',
    movement: 'Push your hips back and bend your knees to lower down as if sitting in a chair. Go as low as comfortable. Drive through your heels to stand back up. Keep your knees in line with your toes.',
    breathing: 'Breathe in as you lower down. Breathe out as you stand up.',
    mistakes: 'Letting your knees cave inward. Rounding your lower back. Lifting your heels off the floor.',
    safety: 'Stop if you feel sharp pain in your knees, hips, or lower back.',
    easyOption: 'Do a partial squat, only going halfway down. Or hold onto a wall or chair for balance.',
  },
  'lunge': {
    setup: 'Stand tall with feet hip-width apart, hands on your hips or by your sides. Keep your chest up and core tight.',
    movement: 'Step one leg forward and lower your hips until both knees are bent at about 90 degrees. Your front knee should be over your ankle. Push back up to the start. Alternate legs.',
    breathing: 'Breathe in as you step forward and lower. Breathe out as you push back up.',
    mistakes: 'Letting your front knee go past your toes. Letting your back knee slam into the floor. Leaning your torso forward.',
    safety: 'Stop if you feel sharp pain in your knees or hips.',
    easyOption: 'Do a shorter lunge, not going as deep. Or hold onto a wall for balance.',
  },
  'lunges': {
    setup: 'Stand tall with feet hip-width apart, hands on your hips or by your sides. Keep your chest up and core tight.',
    movement: 'Step one leg forward and lower your hips until both knees are bent at about 90 degrees. Your front knee should be over your ankle. Push back up to the start. Alternate legs.',
    breathing: 'Breathe in as you step forward and lower. Breathe out as you push back up.',
    mistakes: 'Letting your front knee go past your toes. Letting your back knee slam into the floor. Leaning your torso forward.',
    safety: 'Stop if you feel sharp pain in your knees or hips.',
    easyOption: 'Do a shorter lunge, not going as deep. Or hold onto a wall for balance.',
  },
  'shoulder press': {
    setup: 'Sit or stand tall with a dumbbell in each hand at shoulder height, palms facing forward. Keep your core tight and back straight.',
    movement: 'Press the weights straight up overhead until your arms are fully extended. Lower the weights back down to shoulder height with control. Do not arch your back.',
    breathing: 'Breathe out as you press the weights up. Breathe in as you lower them down.',
    mistakes: 'Arching your lower back. Locking your elbows hard at the top. Using momentum to swing the weights up.',
    safety: 'Stop if you feel sharp pain in your shoulders or lower back.',
    easyOption: 'Use lighter dumbbells. Or do the press seated with back support.',
  },
  'dumbbell shoulder press': {
    setup: 'Sit or stand tall with a dumbbell in each hand at shoulder height, palms facing forward. Keep your core tight and back straight.',
    movement: 'Press the weights straight up overhead until your arms are fully extended. Lower the weights back down to shoulder height with control. Do not arch your back.',
    breathing: 'Breathe out as you press the weights up. Breathe in as you lower them down.',
    mistakes: 'Arching your lower back. Locking your elbows hard at the top. Using momentum to swing the weights up.',
    safety: 'Stop if you feel sharp pain in your shoulders or lower back.',
    easyOption: 'Use lighter dumbbells. Or do the press seated with back support.',
  },
  'lat pulldown': {
    setup: 'Sit at a cable machine with your thighs under the pad. Grab the bar with a wide grip, palms facing forward. Keep your chest up.',
    movement: 'Pull the bar down toward your upper chest by pulling your elbows down and back. Squeeze your shoulder blades together. Slowly return the bar to the start. Do not lean back.',
    breathing: 'Breathe out as you pull the bar down. Breathe in as you return to the start.',
    mistakes: 'Leaning back too far. Pulling the bar behind your neck. Using momentum to jerk the weight down.',
    safety: 'Stop if you feel sharp pain in your shoulders or elbows.',
    easyOption: 'Use a lighter weight. Or use a resistance band anchored overhead for a similar movement.',
  },
  'bench press': {
    setup: 'Lie flat on a bench with your feet on the floor. Grip the barbell slightly wider than shoulder-width. Retract your shoulder blades and plant your feet.',
    movement: 'Lower the bar slowly to your mid-chest. Press the bar back up to the start with control. Keep your wrists stacked over your elbows. Do not bounce the bar off your chest.',
    breathing: 'Breathe in as you lower the bar. Breathe out as you press it up.',
    mistakes: 'Bouncing the bar off your chest. Flaring your elbows past 90 degrees. Lifting your hips off the bench.',
    safety: 'Always use a spotter or safety pins. Stop if you feel sharp pain in your shoulders or chest.',
    easyOption: 'Use a lighter weight. Or do the press with dumbbells for a more controlled range of motion.',
  },
  'barbell bench press': {
    setup: 'Lie flat on a bench with your feet on the floor. Grip the barbell slightly wider than shoulder-width. Retract your shoulder blades and plant your feet.',
    movement: 'Lower the bar slowly to your mid-chest. Press the bar back up to the start with control. Keep your wrists stacked over your elbows. Do not bounce the bar off your chest.',
    breathing: 'Breathe in as you lower the bar. Breathe out as you press it up.',
    mistakes: 'Bouncing the bar off your chest. Flaring your elbows past 90 degrees. Lifting your hips off the bench.',
    safety: 'Always use a spotter or safety pins. Stop if you feel sharp pain in your shoulders or chest.',
    easyOption: 'Use a lighter weight. Or do the press with dumbbells for a more controlled range of motion.',
  },
  'deadlift': {
    setup: 'Stand with your feet hip-width apart, barbell over your mid-foot. Hinge at the hips and grip the bar just outside your knees. Keep your back flat and chest up.',
    movement: 'Drive through your heels and stand up tall by pushing the floor away. Keep the bar close to your body. Squeeze your glutes at the top. Lower the bar back down with control.',
    breathing: 'Breathe in and brace your core before lifting. Breathe out as you stand up.',
    mistakes: 'Rounding your lower back. Letting the bar drift away from your body. Looking up instead of neutral.',
    safety: 'Keep your back flat throughout. Stop if you feel sharp pain in your lower back.',
    easyOption: 'Use a lighter weight. Or do a Romanian deadlift with a shorter range of motion.',
  },
  'romanian deadlift': {
    setup: 'Stand with your feet hip-width apart, holding a barbell or dumbbells in front of your thighs. Keep a soft bend in your knees.',
    movement: 'Hinge at the hips and lower the weight down your legs. Keep your back flat and the weight close to your body. Stop when you feel a stretch in your hamstrings. Drive your hips forward to stand back up.',
    breathing: 'Breathe in as you lower the weight. Breathe out as you stand back up.',
    mistakes: 'Rounding your lower back. Bending your knees too much. Going too low and losing form.',
    safety: 'Stop if you feel sharp pain in your lower back or hamstrings.',
    easyOption: 'Use a lighter weight. Or shorten the range of motion.',
  },
  'pull up': {
    setup: 'Hang from a pull-up bar with hands slightly wider than shoulder-width, palms facing away. Keep your shoulders engaged, not shrugged.',
    movement: 'Pull your body up by pulling your elbows down toward the floor. Bring your chin above the bar. Lower yourself back down with control. Do not kip or swing.',
    breathing: 'Breathe out as you pull yourself up. Breathe in as you lower down.',
    mistakes: 'Kipping or swinging your legs. Shrugging your shoulders. Not going through full range of motion.',
    safety: 'Stop if you feel sharp pain in your shoulders. Use a spotter if you are unsure.',
    easyOption: 'Use a resistance band looped over the bar to help support part of your weight.',
  },
  'pull-up': {
    setup: 'Hang from a pull-up bar with hands slightly wider than shoulder-width, palms facing away. Keep your shoulders engaged, not shrugged.',
    movement: 'Pull your body up by pulling your elbows down toward the floor. Bring your chin above the bar. Lower yourself back down with control. Do not kip or swing.',
    breathing: 'Breathe out as you pull yourself up. Breathe in as you lower down.',
    mistakes: 'Kipping or swinging your legs. Shrugging your shoulders. Not going through full range of motion.',
    safety: 'Stop if you feel sharp pain in your shoulders. Use a spotter if you are unsure.',
    easyOption: 'Use a resistance band looped over the bar to help support part of your weight.',
  },
  'chin up': {
    setup: 'Hang from a pull-up bar with hands shoulder-width apart, palms facing toward you. Keep your shoulders engaged.',
    movement: 'Pull your body up by pulling your elbows down toward the floor. Bring your chin above the bar. Lower yourself back down with control.',
    breathing: 'Breathe out as you pull yourself up. Breathe in as you lower down.',
    mistakes: 'Kipping or swinging your legs. Shrugging your shoulders. Not going through full range of motion.',
    safety: 'Stop if you feel sharp pain in your shoulders. Use a spotter if you are unsure.',
    easyOption: 'Use a resistance band looped over the bar to help support part of your weight.',
  },
  'sit up': {
    setup: 'Lie on your back with knees bent and feet flat on the floor. Place your hands lightly beside your head. Do not pull on your neck.',
    movement: 'Engage your core and lift your head, shoulders, and upper back off the floor. Slowly lower back down with control. Do not jerk your body up using momentum.',
    breathing: 'Breathe out as you sit up. Breathe in as you lower down.',
    mistakes: 'Pulling on your neck with your hands. Jerking your body up using momentum. Arching your lower back.',
    safety: 'Stop if you feel sharp pain in your neck or lower back.',
    easyOption: 'Do a crunch instead, lifting just your head and shoulders off the floor.',
  },
  'sit-up': {
    setup: 'Lie on your back with knees bent and feet flat on the floor. Place your hands lightly beside your head. Do not pull on your neck.',
    movement: 'Engage your core and lift your head, shoulders, and upper back off the floor. Slowly lower back down with control. Do not jerk your body up using momentum.',
    breathing: 'Breathe out as you sit up. Breathe in as you lower down.',
    mistakes: 'Pulling on your neck with your hands. Jerking your body up using momentum. Arching your lower back.',
    safety: 'Stop if you feel sharp pain in your neck or lower back.',
    easyOption: 'Do a crunch instead, lifting just your head and shoulders off the floor.',
  },
  'crunch': {
    setup: 'Lie on your back with knees bent and feet flat on the floor. Place your hands lightly beside your head. Do not pull on your neck.',
    movement: 'Engage your core and lift your head and shoulders just off the floor. Slowly lower back down with control. Focus on your abs, not your neck.',
    breathing: 'Breathe out as you crunch up. Breathe in as you lower down.',
    mistakes: 'Pulling on your neck with your hands. Lifting your lower back off the floor. Rushing the movement.',
    safety: 'Stop if you feel sharp pain in your neck or lower back.',
    easyOption: 'Lift only your head, not your shoulders. Or place your feet farther from your body.',
  },
  'glute bridge': {
    setup: 'Lie on your back with knees bent and feet flat on the floor, hip-width apart. Arms by your sides. Keep your core tight.',
    movement: 'Squeeze your glutes and lift your hips up toward the ceiling until your body forms a straight line from knees to shoulders. Hold for a moment. Lower your hips back down with control.',
    breathing: 'Breathe out as you lift your hips. Breathe in as you lower down.',
    mistakes: 'Arching your lower back at the top. Pushing through your toes instead of your heels. Holding your breath.',
    safety: 'Stop if you feel sharp pain in your lower back or hips.',
    easyOption: 'Do a smaller range of motion, lifting your hips only a few inches off the floor.',
  },
  'calf raise': {
    setup: 'Stand tall with your feet hip-width apart. Hold onto a wall or chair for balance if needed.',
    movement: 'Push up onto the balls of your feet, lifting your heels as high as you can. Hold for a moment. Slowly lower your heels back down with control.',
    breathing: 'Breathe out as you lift your heels. Breathe in as you lower them.',
    mistakes: 'Bouncing at the top. Rushing the lowering phase. Bending your knees.',
    safety: 'Hold onto something stable for balance to avoid falling.',
    easyOption: 'Do the raises seated, with a weight on your thighs for resistance.',
  },
  'tricep dip': {
    setup: 'Sit on the edge of a sturdy chair or bench. Place your hands beside your hips. Walk your feet forward and slide your hips off the edge.',
    movement: 'Bend your elbows to lower your hips toward the floor. Keep your back close to the chair. Press through your hands to straighten your arms and lift back up.',
    breathing: 'Breathe in as you lower down. Breathe out as you press back up.',
    mistakes: 'Letting your shoulders shrug up. Flaring your elbows out. Going too low and hurting your shoulders.',
    safety: 'Stop if you feel sharp pain in your shoulders or elbows.',
    easyOption: 'Bend your knees instead of keeping your legs straight. This makes the exercise much easier.',
  },
  'lateral raise': {
    setup: 'Stand tall with a dumbbell in each hand by your sides, palms facing in. Keep your core tight and shoulders down.',
    movement: 'Lift the weights out to your sides until your arms are parallel to the floor. Keep a slight bend in your elbows. Slowly lower the weights back down. Do not swing.',
    breathing: 'Breathe out as you lift the weights. Breathe in as you lower them.',
    mistakes: 'Shrugging your shoulders. Swinging the weights. Going above shoulder height.',
    safety: 'Stop if you feel sharp pain in your shoulders.',
    easyOption: 'Use lighter dumbbells. Or lift only halfway up.',
  },
  'kettlebell swing': {
    setup: 'Stand with feet slightly wider than shoulder-width. Hold a kettlebell with both hands, letting it hang in front of you. Keep your back flat and core tight.',
    movement: 'Hinge at the hips and swing the kettlebell back between your legs. Drive your hips forward to swing the kettlebell up to chest height. Let the weight do the work, not your arms.',
    breathing: 'Breathe out sharply as you swing the kettlebell up. Breathe in as it swings down.',
    mistakes: 'Lifting with your arms instead of your hips. Rounding your lower back. Squatting instead of hinging.',
    safety: 'Stop if you feel sharp pain in your lower back. Use a lighter kettlebell to start.',
    easyOption: 'Use a lighter kettlebell. Or do a hip thrust with the kettlebell instead.',
  },
  'russian twist': {
    setup: 'Sit on the floor with knees bent. Lean your torso back slightly and lift your feet off the floor. Hold a weight or ball in front of your chest.',
    movement: 'Twist your torso to one side, bringing the weight toward the floor. Twist to the other side. Keep your core engaged and your back straight throughout.',
    breathing: 'Breathe out as you twist to each side. Breathe in as you return to center.',
    mistakes: 'Rounding your lower back. Moving only your arms and not your torso. Going too fast.',
    safety: 'Stop if you feel sharp pain in your lower back.',
    easyOption: 'Keep your feet on the floor for more support. Or skip the weight and just twist your torso.',
  },
  'mountain climber': {
    setup: 'Start in a high plank position with hands under shoulders. Body in a straight line from head to heels.',
    movement: 'Bring one knee toward your chest, then quickly switch legs, jumping the back foot forward and the front foot back. Keep your hips level and core tight.',
    breathing: 'Breathe steadily throughout. Do not hold your breath.',
    mistakes: 'Letting your hips bounce up. Holding your breath. Rushing the movement with no control.',
    safety: 'Stop if you feel sharp pain in your shoulders or wrists.',
    easyOption: 'Step one leg in at a time, no jumping. This is a much easier version.',
  },
  'high knees': {
    setup: 'Stand tall with feet hip-width apart. Arms by your sides. Engage your core.',
    movement: 'Run in place, lifting each knee up toward your chest as high as you can. Pump your arms in a running motion. Move at a quick, controlled pace.',
    breathing: 'Breathe steadily in and out through your nose and mouth.',
    mistakes: 'Leaning your torso back. Landing flat-footed. Holding your breath.',
    safety: 'Land softly on the balls of your feet to protect your knees.',
    easyOption: 'Do a march in place instead of running. Lift your knees only halfway up.',
  },
  'jumping jack': {
    setup: 'Stand tall with feet together and arms by your sides. Engage your core and keep a slight bend in your knees.',
    movement: 'Jump up and spread your feet wider than shoulder-width while raising your arms overhead. Jump again to return to the start. Land softly on the balls of your feet.',
    breathing: 'Breathe steadily throughout. Do not hold your breath.',
    mistakes: 'Landing with stiff legs. Letting your knees cave inward. Holding your breath.',
    safety: 'Land softly to protect your knees and ankles.',
    easyOption: 'Step one foot out at a time, no jumping. Or do the movement with a smaller arm raise.',
  },
  'jumping jacks': {
    setup: 'Stand tall with feet together and arms by your sides. Engage your core and keep a slight bend in your knees.',
    movement: 'Jump up and spread your feet wider than shoulder-width while raising your arms overhead. Jump again to return to the start. Land softly on the balls of your feet.',
    breathing: 'Breathe steadily throughout. Do not hold your breath.',
    mistakes: 'Landing with stiff legs. Letting your knees cave inward. Holding your breath.',
    safety: 'Land softly to protect your knees and ankles.',
    easyOption: 'Step one foot out at a time, no jumping. Or do the movement with a smaller arm raise.',
  },
  'wall sit': {
    setup: 'Stand with your back flat against a wall. Slide your feet out about two feet in front of you, hip-width apart.',
    movement: 'Slide your back down the wall until your knees are bent at about 90 degrees, as if sitting in a chair. Hold this position. Keep your back flat against the wall and core engaged.',
    breathing: 'Breathe slowly and steadily. Do not hold your breath.',
    mistakes: 'Letting your knees go past your toes. Sitting too low and rounding your back. Holding your breath.',
    safety: 'Stop if you feel sharp pain in your knees or lower back.',
    easyOption: 'Hold the position for less time. Or do a partial wall sit with knees bent at 45 degrees.',
  },
  'burpee': {
    setup: 'Stand tall with feet shoulder-width apart. Arms by your sides.',
    movement: 'Squat down and place your hands on the floor. Jump or step your feet back into a plank. Do one push-up (optional). Jump or step your feet back toward your hands. Stand up and jump up, raising your arms overhead.',
    breathing: 'Breathe out as you jump up. Breathe in as you go down into the plank.',
    mistakes: 'Letting your hips sag in the plank. Landing with stiff legs. Going so fast you lose form.',
    safety: 'Skip the push-up if you cannot maintain good form. Stop if you feel sharp pain in your shoulders or lower back.',
    easyOption: 'Step your feet back into the plank instead of jumping. Or skip the push-up entirely.',
  },
  'barbell squat': {
    setup: 'Set the bar in a rack at upper-back height. Step under it and place it across your upper traps. Grip the bar wider than your shoulders. Step back and stand with feet shoulder-width apart.',
    movement: 'Push your hips back and bend your knees to lower down. Go as low as comfortable while keeping your chest up. Drive through your heels to stand back up. Keep your knees in line with your toes.',
    breathing: 'Breathe in and brace your core before lowering. Breathe out as you stand up.',
    mistakes: 'Letting your knees cave inward. Rounding your lower back. Lifting your heels off the floor.',
    safety: 'Use safety pins or a spotter. Stop if you feel sharp pain in your knees, hips, or lower back.',
    easyOption: 'Use a lighter weight. Or do a goblet squat with a dumbbell held at your chest.',
  },
  'barbell row': {
    setup: 'Stand with feet hip-width apart. Hinge at the hips and grip the barbell with hands just outside your knees. Keep your back flat and chest up.',
    movement: 'Pull the bar up to your lower chest by driving your elbows back. Squeeze your shoulder blades together at the top. Lower the bar back down with control. Do not jerk.',
    breathing: 'Breathe out as you pull the bar up. Breathe in as you lower it down.',
    mistakes: 'Jerking the bar with your body. Rounding your lower back. Shrugging your shoulders.',
    safety: 'Stop if you feel sharp pain in your lower back.',
    easyOption: 'Use a lighter weight. Or do a single-arm dumbbell row for a more controlled movement.',
  },
  'leg raise': {
    setup: 'Lie flat on your back with legs straight. Place your hands under your hips for support. Keep your core tight.',
    movement: 'Lift your legs up toward the ceiling until they are perpendicular to the floor. Slowly lower your legs back down, stopping just before they touch the floor. Do not arch your lower back.',
    breathing: 'Breathe out as you lift your legs. Breathe in as you lower them down.',
    mistakes: 'Arching your lower back. Lowering your legs too far. Using momentum to swing your legs up.',
    safety: 'Stop if you feel sharp pain in your lower back.',
    easyOption: 'Bend your knees to a 90-degree angle. This is much easier on your lower back.',
  },
  'face pull': {
    setup: 'Set a cable machine to upper-chest height. Grab the rope attachment with both hands, palms facing each other. Step back to put tension on the cable.',
    movement: 'Pull the rope toward your face, separating your hands as you go. Squeeze your shoulder blades together. Slowly return to the start with control.',
    breathing: 'Breathe out as you pull the rope toward your face. Breathe in as you return to start.',
    mistakes: 'Shrugging your shoulders. Using momentum to jerk the weight. Not squeezing your shoulder blades.',
    safety: 'Stop if you feel sharp pain in your shoulders.',
    easyOption: 'Use a lighter weight. Or use a resistance band anchored at chest height.',
  },
  'cable fly': {
    setup: 'Set both cable machines to upper-chest height. Grab a handle in each hand. Step forward into a staggered stance. Keep a slight bend in your elbows.',
    movement: 'Bring your hands together in front of your chest in a wide arc, as if hugging a tree. Squeeze your chest at the center. Slowly return to the start with control.',
    breathing: 'Breathe out as you bring your hands together. Breathe in as you return to start.',
    mistakes: 'Bending your elbows too much. Locking your elbows straight. Rushing the movement.',
    safety: 'Stop if you feel sharp pain in your shoulders or chest.',
    easyOption: 'Use lighter weight. Or do the same movement with a resistance band.',
  },
  'push press': {
    setup: 'Stand tall with a barbell at your shoulders, elbows down. Feet shoulder-width apart. Keep your core tight.',
    movement: 'Dip a few inches by bending your knees. Explosively drive up through your legs to press the bar overhead. Lock out your arms at the top. Lower the bar back to your shoulders with control.',
    breathing: 'Breathe in as you dip. Breathe out sharply as you press the bar up.',
    mistakes: 'Pressing with arms only, no leg drive. Arching your lower back. Pressing the bar out in front instead of straight up.',
    safety: 'Stop if you feel sharp pain in your shoulders or lower back. Use a spotter for heavy weights.',
    easyOption: 'Use a lighter weight. Or do a strict shoulder press without the leg drive.',
  },
};

const BODYWEIGHT_REGRESS_KEYWORDS = [
  'push up', 'push-up', 'pull up', 'pull-up', 'chin up', 'chin-up',
  'squat', 'lunge', 'dip', 'step up', 'step-up', 'burpee',
];
const HOLD_KEYWORDS = [
  'plank', 'wall sit', 'bridge', 'dead hang', 'hollow', 'hold',
];
const CARDIO_KEYWORDS = [
  'mountain climber', 'high knees', 'jumping jack', 'burpee',
  'squat jump', 'lunge jump', 'skater', 'skater jump', 'box jump',
];
const CHEST_KEYWORDS = ['push up', 'push-up', 'bench', 'fly', 'dip', 'press'];
const BACK_KEYWORDS = ['pull up', 'pull-up', 'row', 'pulldown', 'chin up', 'chin-up', 'deadlift'];
const SHOULDER_KEYWORDS = ['press', 'raise', 'fly', 'lateral', 'face pull', 'overhead'];
const ARM_KEYWORDS = ['curl', 'extension', 'tricep', 'bicep', 'hammer', 'skull crusher'];
const CORE_KEYWORDS = ['crunch', 'sit up', 'sit-up', 'plank', 'twist', 'leg raise', 'mountain', 'hollow'];
const LEG_KEYWORDS = ['squat', 'lunge', 'leg press', 'step up', 'step-up', 'calf', 'glute', 'deadlift', 'rdl'];

function normalizeKey(name: string): string {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

function matchesAny(name: string, keywords: string[]): boolean {
  return keywords.some((k) => name.includes(k));
}

function detectCategory(name: string): 'chest' | 'back' | 'shoulder' | 'arm' | 'core' | 'leg' | 'unknown' {
  if (matchesAny(name, CHEST_KEYWORDS)) return 'chest';
  if (matchesAny(name, BACK_KEYWORDS)) return 'back';
  if (matchesAny(name, SHOULDER_KEYWORDS)) return 'shoulder';
  if (matchesAny(name, ARM_KEYWORDS)) return 'arm';
  if (matchesAny(name, CORE_KEYWORDS)) return 'core';
  if (matchesAny(name, LEG_KEYWORDS)) return 'leg';
  return 'unknown';
}

function buildMistakes(category: string, name: string): string {
  switch (category) {
    case 'chest':
      return 'Do not flare your elbows past 90 degrees. Do not bounce the weight off your chest.';
    case 'back':
      return 'Do not shrug your shoulders. Do not jerk the weight up using momentum.';
    case 'shoulder':
      return 'Do not lock your elbows at the top. Do not arch your lower back.';
    case 'arm':
      return 'Do not swing the weight with your body. Do not lock your joints at the top.';
    case 'core':
      return 'Do not pull on your neck with your hands. Do not arch your lower back.';
    case 'leg':
      return 'Do not let your knees cave inward. Do not round your lower back.';
    default:
      return name.includes('hold') || name.includes('plank')
        ? 'Do not let your hips sag or pike up. Do not hold your breath.'
        : 'Do not rush the movement. Maintain proper form throughout.';
  }
}

function buildEasyOption(equipment: string, name: string): string {
  const lower = name.toLowerCase();
  if (matchesAny(lower, HOLD_KEYWORDS)) {
    return 'Hold the position for less time, or do it from your knees.';
  }
  if (matchesAny(lower, CARDIO_KEYWORDS)) {
    return 'Do the movement at a slower pace, or step instead of jump.';
  }
  if (matchesAny(lower, BODYWEIGHT_REGRESS_KEYWORDS)) {
    return 'Do the movement from your knees, or with a reduced range of motion.';
  }
  const equip = (equipment || '').toLowerCase();
  if (['dumbbell', 'barbell', 'kettlebell', 'cable', 'machine', 'band'].includes(equip)) {
    return 'Use a lighter weight, or do the movement without any weight.';
  }
  return 'Reduce the range of motion or do fewer reps.';
}

function buildBreathing(equipment: string, name: string): string {
  const lower = name.toLowerCase();
  if (matchesAny(lower, HOLD_KEYWORDS)) {
    return 'Breathe slowly and steadily through your nose. Do not hold your breath.';
  }
  if (matchesAny(lower, CARDIO_KEYWORDS)) {
    return 'Breathe steadily in and out. Match your breathing to your pace.';
  }
  return 'Breathe out as you do the effort phase. Breathe in as you return to the start.';
}

function buildSafety(): string {
  return 'Stop if you feel sharp pain, dizziness, or joint discomfort.';
}

function buildSetupFromInstructions(instructions: string[]): string {
  if (!instructions?.length) return 'Get into the starting position for this exercise. Read the steps below carefully before you begin.';
  return instructions[0].replace(/^step:\d+\s*/i, '').trim() || 'Get into the starting position for this exercise.';
}

function buildMovementFromInstructions(instructions: string[]): string {
  if (!instructions?.length) return 'Perform the exercise with slow, controlled movement. Focus on the muscles you are working.';
  const rest = instructions.slice(1).map((s) => s.replace(/^step:\d+\s*/i, '').trim()).filter(Boolean);
  return rest.length ? rest.join('. ') : instructions[0];
}

export function getFormGuide(input: {
  name: string;
  equipment?: Equipment | string;
  instructions?: string[];
}): ExerciseFormGuide {
  const key = normalizeKey(input.name);
  if (key && CURATED[key]) return CURATED[key];

  const name = input.name || '';
  const lower = name.toLowerCase();
  const category = detectCategory(lower);

  return {
    setup: buildSetupFromInstructions(input.instructions || []),
    movement: buildMovementFromInstructions(input.instructions || []),
    breathing: buildBreathing(input.equipment as string || '', lower),
    mistakes: buildMistakes(category, lower),
    safety: buildSafety(),
    easyOption: buildEasyOption(input.equipment as string || '', lower),
  };
}
