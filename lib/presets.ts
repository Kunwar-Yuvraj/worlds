export type WorldPreset = {
  genre: string;
  name: string;
  tagline: string;
  playerCount: string;
  rulesText: string;
  seedContext: string;
  tone: string;
  powerSystem: string;
  hardRules: string[];
  factions: string[];
  startingPressure: string;
  storyProtocol: string;
  currentTime: string;
  currentSituation: string;
  openingThread: { title: string; publicSummary: string; stakes: string };
  hiddenPlot: {
    hiddenTruth: string;
    secrets: string[];
    plannedReversals: string[];
    integritySummary: string;
  };
  locations: {
    id: string;
    name: string;
    description: string;
    atmosphere: string;
    publicState: string;
    connectedLocationIds: string[];
  }[];
  npcs: {
    id: string;
    name: string;
    role: string;
    appearance: string;
    personality: string;
    publicFace: string;
    currentObjective: string;
    currentLocationId: string;
    status: string;
    publicSummary: string;
  }[];
};

export const PRESETS: WorldPreset[] = [
  {
    genre: 'Co-op murder mystery',
    name: 'Murder at Glasshouse Manor',
    tagline: 'Share clues. Test alibis. Name the killer before dawn.',
    playerCount: '1–4 investigators',
    rulesText: 'The culprit, motive, method, and evidence are fixed from the beginning. No supernatural explanations. Claims remain theories until supported by discoverable evidence.',
    seedContext: 'At midnight, celebrated illusionist Lucien Vale is found dead inside the locked conservatory of Glasshouse Manor. A storm has cut the estate off from the mainland, and every guest had a reason to want his final performance cancelled.\n\nYou have until the police launch arrives at dawn to compare private discoveries, interrogate suspects, and agree on an accusation. A wrong accusation gives the killer time to erase the last proof.',
    tone: 'Elegant, tense, clue-driven, and suspicious; an ensemble mystery where observation beats violence.',
    powerSystem: 'Investigation: observation, interviews, reconstruction, leverage, and sharing evidence with other investigators.',
    hardRules: ['The solution never changes to fit a guess.', 'Every decisive deduction must trace back to available evidence.', 'Players may keep discoveries private or share them as scene canon.'],
    factions: ['The Vale family', 'The stranded guests', 'The manor staff', 'The investigators'],
    startingPressure: 'Dawn is approaching, one room has already been searched, and someone has begun destroying evidence.',
    storyProtocol: 'Track clues, alibis, contradictions, and the fixed solution. Never confirm a theory early. Shared scenes expose only what characters visibly say, show, or discover together.',
    currentTime: '12:17 AM — four hours to dawn',
    currentSituation: 'The conservatory is sealed, the guests are confined to the manor, and the first round of alibis is beginning.',
    openingThread: {
      title: 'The impossible conservatory murder',
      publicSummary: 'Discover how Lucien Vale died, who killed him, and which apparent impossibility was staged.',
      stakes: 'Accuse correctly before dawn or let the murderer escape with the final piece of evidence.',
    },
    hiddenPlot: {
      hiddenTruth: 'Lucien was poisoned before entering the conservatory; the locked-room spectacle was staged after death by the person controlling the manor’s old service passages.',
      secrets: ['The victim planned to expose a forged inheritance document.', 'A stopped pocket watch records the time the body was moved, not the time of death.', 'One staff member is protecting a suspect for an unrelated crime.'],
      plannedReversals: ['The locked door is a distraction rather than the murder method.', 'The most obvious liar is concealing a scandal, not the killing.'],
      integritySummary: 'Keep the culprit and method fixed. Seed fair physical and testimonial clues, preserve the dawn deadline, and separate lies about the murder from lies about private scandals.',
    },
    locations: [
      { id: 'grand-salon', name: 'Grand Salon', description: 'A chandelier-lit room where the stranded guests are being questioned.', atmosphere: 'Polite panic under crystal light', publicState: 'Everyone is present, watching who speaks first.', connectedLocationIds: ['glass-conservatory', 'service-corridor'] },
      { id: 'glass-conservatory', name: 'Glass Conservatory', description: 'The rain-lashed locked room where Lucien’s final illusion ended in death.', atmosphere: 'Wet leaves, broken glass, and theatrical stillness', publicState: 'The body has been removed, but the scene remains sealed for examination.', connectedLocationIds: ['grand-salon'] },
      { id: 'service-corridor', name: 'Service Corridor', description: 'A narrow hidden artery connecting kitchens, studies, and forgotten doors.', atmosphere: 'Dusty, cramped, and recently disturbed', publicState: 'Most guests claim they did not know it existed.', connectedLocationIds: ['grand-salon'] },
    ],
    npcs: [
      { id: 'celeste-vale', name: 'Celeste Vale', role: 'Victim’s estranged sister', appearance: 'Silver evening dress, rain-darkened gloves, unwavering posture.', personality: 'Controlled, incisive, privately furious.', publicFace: 'A grieving relative determined to protect the family name.', currentObjective: 'Keep the inheritance scandal out of the investigation.', currentLocationId: 'grand-salon', status: 'active', publicSummary: 'Celeste says she spent the crucial hour alone in the music room.' },
      { id: 'ellis-rowe', name: 'Ellis Rowe', role: 'Stage engineer', appearance: 'Rolled sleeves, burn-marked fingertips, brass key ring.', personality: 'Practical, defensive, loyal to the craft.', publicFace: 'The person who understands Lucien’s mechanisms best.', currentObjective: 'Recover a missing apparatus ledger before anyone reads it.', currentLocationId: 'grand-salon', status: 'active', publicSummary: 'Ellis insists the conservatory lock could not have been remotely operated.' },
    ],
  },
  {
    genre: 'Co-op gothic adventure',
    name: 'The Last Order of 1891',
    tagline: 'Ride as the final knights in an age that has stopped believing.',
    playerCount: '1–4 oathbound',
    rulesText: 'This is an alternate 1891 where knightly orders survived into the industrial age. Steel, early firearms, steam engines, and rare ritual relics coexist. Oaths grant authority, not invincibility.',
    seedContext: 'In 1891, railways cross the old kingdoms and newspapers mock the remaining knightly orders as relics. Then every bell in Greyhaven rings at once, the northern fortress goes dark, and riders arrive carrying the broken banner of the Last Order.\n\nOne oathbound knight—or a fellowship—must cross a city divided between crown, industry, and old faith, discover what entered beneath the fortress, and decide whether the Order deserves to survive the century.',
    tone: 'Gothic, heroic, morally complicated, rain-soaked alternate history with fellowship and sacrifice.',
    powerSystem: 'Human skill, steel, early firearms, social rank, and scarce oath-relics whose use creates binding obligations.',
    hardRules: ['No modern technology beyond plausible alternate 1891 engineering.', 'Relics demand a stated oath and impose a consequence when that oath is broken.', 'No player is a chosen one; a solo player gains NPC companions while groups divide knightly roles.'],
    factions: ['The Last Order', 'The Royal Ministry', 'The Iron Syndicate', 'The Lantern Church'],
    startingPressure: 'Greyhaven’s gates close at sunrise while something beneath the fortress is waking.',
    storyProtocol: 'Balance investigation, travel, court politics, and grounded combat. Preserve each knight’s agency and make sworn promises mechanically consequential.',
    currentTime: 'November 3, 1891 — before sunrise',
    currentSituation: 'The broken banner has reached Greyhaven, but the messenger vanished before naming the force that took the northern fortress.',
    openingThread: {
      title: 'The silence beneath Northwatch',
      publicSummary: 'Reach the fallen fortress, learn why its garrison disappeared, and decide which faction can be trusted with the truth.',
      stakes: 'If the fortress bells ring a thirteenth time, Greyhaven’s sealed underground gate will open.',
    },
    hiddenPlot: {
      hiddenTruth: 'The Iron Syndicate’s excavation breached an ancient prison, and the Royal Ministry concealed it to force the Last Order into one final expendable mission.',
      secrets: ['The broken banner bears fresh Ministry cipher marks.', 'The Order’s oldest oath contains instructions for closing the underground gate.', 'A supposed traitor at Northwatch is keeping survivors alive below the fortress.'],
      plannedReversals: ['The accused deserter is a rescuer.', 'Saving the city may require publicly ending the Order rather than restoring it.'],
      integritySummary: 'Maintain the alternate-1891 technology, oath consequences, faction culpability, and the fixed cause of Northwatch’s fall.',
    },
    locations: [
      { id: 'order-hall', name: 'Hall of the Last Order', description: 'A once-grand chapter house crowded by telegram wires, old armor, and unpaid bills.', atmosphere: 'Faded honor beneath electric lamps', publicState: 'The surviving oathbound are being summoned for one final ride.', connectedLocationIds: ['greyhaven-station', 'northwatch-road'] },
      { id: 'greyhaven-station', name: 'Greyhaven Central Station', description: 'Steam, iron arches, royal soldiers, and trains halted without explanation.', atmosphere: 'Industrial urgency and whispered fear', publicState: 'The Ministry is confiscating every northbound ticket.', connectedLocationIds: ['order-hall'] },
      { id: 'northwatch-road', name: 'Northwatch Road', description: 'A mountain road where telegraph poles end and medieval watchtowers begin.', atmosphere: 'Cold rain and distant bells', publicState: 'Refugees report lights moving beneath the ruined fortress.', connectedLocationIds: ['order-hall'] },
    ],
    npcs: [
      { id: 'dame-eleanor-voss', name: 'Dame Eleanor Voss', role: 'Commander of the Last Order', appearance: 'Weathered cavalry coat over ceremonial plate, one mechanical hand.', personality: 'Exacting, courageous, burdened by compromise.', publicFace: 'The unbreakable final commander.', currentObjective: 'Send a fellowship north before the Ministry dissolves the Order.', currentLocationId: 'order-hall', status: 'active', publicSummary: 'Eleanor offers authority, incomplete intelligence, and no promise of rescue.' },
      { id: 'tomas-wren', name: 'Tomas Wren', role: 'Investigative newspaper correspondent', appearance: 'Ink-black coat, camera case, perpetually damp notebook.', personality: 'Curious, irreverent, braver than he admits.', publicFace: 'A reporter chasing the century’s last knightly scandal.', currentObjective: 'Prove the Ministry caused the Northwatch disaster.', currentLocationId: 'greyhaven-station', status: 'active', publicSummary: 'Tomas has a confiscated telegram addressed to the Order.' },
    ],
  },
  {
    genre: 'Social debate game',
    name: 'The Midnight Debate Club',
    tagline: 'Make the case. Form alliances. Win the room—not just the argument.',
    playerCount: '1–6 speakers',
    rulesText: 'The moderator announces a debatable fictional motion and runs opening statements, cross-examination, coalition, and closing rounds. Arguments may be strategic but invented evidence and personal abuse are rejected.',
    seedContext: 'Once a month, after the city’s last train, the doors of the Midnight Assembly open for a debate whose winning argument becomes law inside a fictional city for one year.\n\nTonight’s motion is revealed only after the speakers take their seats. Every participant receives a public position, a private priority, and the same challenge: persuade the room without surrendering what they actually came to protect.',
    tone: 'Clever, social, playful, dramatic, and fast-moving; part salon debate, part alliance game.',
    powerSystem: 'Rhetoric, evidence supplied by the moderator, cross-examination, concessions, coalition-building, and audience momentum.',
    hardRules: ['Debate fictional civic dilemmas, not targeted harassment or real-person abuse.', 'The moderator distinguishes sourced scenario facts from rhetorical claims.', 'Solo play supplies rival NPC speakers; group play gives each player independent agency and a private priority.'],
    factions: ['Reform bloc', 'Continuity bloc', 'Undecided gallery', 'The moderator’s bench'],
    startingPressure: 'The motion is about to be announced and each speaker must choose an opening position before hearing every hidden consequence.',
    storyProtocol: 'Run clear debate rounds. Track concessions, contradictions, alliances, audience sentiment, and the final vote. Keep the tone spirited rather than hostile.',
    currentTime: '11:59 PM — doors locked',
    currentSituation: 'The speakers have taken their seats, sealed role cards are waiting, and the moderator is lifting tonight’s motion from a black envelope.',
    openingThread: {
      title: 'Tonight’s motion',
      publicSummary: 'Take a position, interrogate rival arguments, and shape the final policy adopted by the fictional city.',
      stakes: 'The winning coalition determines the ending and which private priorities survive the compromise.',
    },
    hiddenPlot: {
      hiddenTruth: 'The motion concerns replacing the city’s human memory archive with a predictive machine; neither simple acceptance nor rejection protects every public need.',
      secrets: ['The archive is failing faster than officials admitted.', 'The predictive machine was trained on records missing an entire district.', 'A hybrid solution is possible but requires two rival blocs to concede power.'],
      plannedReversals: ['New evidence will weaken the initially popular position.', 'The final vote can be won through coalition rather than rhetorical dominance.'],
      integritySummary: 'Moderate fair rounds, reveal scenario evidence on schedule, never fabricate a player’s statement, and let solo NPC rivals challenge rather than merely agree.',
    },
    locations: [
      { id: 'assembly-floor', name: 'Assembly Floor', description: 'A circular chamber with six desks beneath a midnight-blue glass dome.', atmosphere: 'Electric anticipation and theatrical civility', publicState: 'Opening positions will become public the moment the bell rings.', connectedLocationIds: ['whisper-gallery'] },
      { id: 'whisper-gallery', name: 'Whisper Gallery', description: 'A side chamber for private caucuses, bargains, and rehearsed concessions.', atmosphere: 'Confidential, strategic, faintly conspiratorial', publicState: 'Any agreement made here matters only if someone later honors it.', connectedLocationIds: ['assembly-floor'] },
    ],
    npcs: [
      { id: 'moderator-iman-sayeed', name: 'Iman Sayeed', role: 'Impartial moderator', appearance: 'Midnight suit, silver timer, unreadable expression.', personality: 'Precise, witty, impossible to rush.', publicFace: 'Guardian of the rules and keeper of scenario evidence.', currentObjective: 'Force the room beyond slogans toward a defensible decision.', currentLocationId: 'assembly-floor', status: 'active', publicSummary: 'Iman will stop unsupported claims and reward meaningful concessions.' },
      { id: 'cass-mercer', name: 'Cass Mercer', role: 'Rival speaker', appearance: 'Crimson waistcoat, annotated cards, easy smile.', personality: 'Charismatic, opportunistic, surprisingly principled.', publicFace: 'A formidable speaker willing to switch coalitions.', currentObjective: 'Win protection for the neglected river district.', currentLocationId: 'assembly-floor', status: 'active', publicSummary: 'Cass has not yet revealed which side they intend to support.' },
    ],
  },
  {
    genre: 'Co-op cinematic heist',
    name: 'The Aurora Express Job',
    tagline: 'Build the crew. Steal the impossible ledger. Get off before sunrise.',
    playerCount: '1–5 specialists',
    rulesText: 'The train keeps moving and time advances with every major action. The crew can improvise, but no skill bypasses every obstacle. Violence increases security and changes the ending.',
    seedContext: 'The Aurora Express leaves the capital at midnight carrying ministers, jewel merchants, undercover agents, and a black ledger capable of collapsing the regime’s secret economy. It will cross the border at sunrise and never stop along the way.\n\nA lone operator—or a crew of specialists—has one night to locate the ledger, discover who else is hunting it, and escape a train where every carriage hides a different kind of trap.',
    tone: 'Stylish, kinetic, clever, suspenseful, and occasionally funny; competence under pressure with room for betrayal.',
    powerSystem: 'Specialist skills, disguises, social engineering, gadgets, coordinated timing, favors, and a rising security-alert level.',
    hardRules: ['The train’s route and clock always advance.', 'Every specialist has strengths and blind spots.', 'Loud violence raises security and closes subtle routes.', 'Solo play provides recruitable NPC crew members; group play distributes specialties.'],
    factions: ['The crew', 'Rail security', 'The Ministry delegation', 'Competing thieves'],
    startingPressure: 'The ledger changes hands somewhere aboard the train in twenty minutes, while security quietly searches for an unlisted passenger.',
    storyProtocol: 'Track time, carriage location, alert level, disguises, discovered routes, and crew coordination. Reward plans while preserving complications and consequences.',
    currentTime: '12:08 AM — fifty-two minutes to the mountain tunnel',
    currentSituation: 'The train is at full speed, the ledger’s courier is missing from first class, and security has begun checking tickets carriage by carriage.',
    openingThread: {
      title: 'Find the black ledger',
      publicSummary: 'Identify the courier, reach the ledger, and choose who should possess it when the train crosses the border.',
      stakes: 'Failure exposes the crew; success could enrich them, topple a government, or empower something worse.',
    },
    hiddenPlot: {
      hiddenTruth: 'The courier staged their disappearance and split the ledger’s cipher across three objects carried by rival passengers.',
      secrets: ['The dining-car pianist is an undercover rail marshal.', 'A competing thief knows one cipher object but not what it opens.', 'The ledger implicates the client who hired the crew.'],
      plannedReversals: ['Finding the ledger is easier than deciding who deserves it.', 'The apparent security lockdown is partly aimed at another crime.'],
      integritySummary: 'Advance the train clock, preserve the three-part cipher, track alert consequences, and keep every route solvable by solo ingenuity or coordinated specialties.',
    },
    locations: [
      { id: 'observation-car', name: 'Observation Car', description: 'Velvet seats, moonlit glass, and powerful passengers pretending not to watch one another.', atmosphere: 'Luxurious, exposed, socially dangerous', publicState: 'A ticket inspection is moving closer from the rear carriages.', connectedLocationIds: ['dining-car'] },
      { id: 'dining-car', name: 'Dining Car', description: 'White linen, a live piano, and too many mirrored surfaces.', atmosphere: 'Elegant noise masking quiet exchanges', publicState: 'The courier’s untouched supper is still warm.', connectedLocationIds: ['observation-car', 'baggage-car'] },
      { id: 'baggage-car', name: 'Baggage and Mail Car', description: 'Locked cages, diplomatic trunks, and the thunder of the rails beneath thin steel.', atmosphere: 'Mechanical, cramped, full of possible exits', publicState: 'A security seal has been broken from the inside.', connectedLocationIds: ['dining-car'] },
    ],
    npcs: [
      { id: 'vivienne-rook', name: 'Vivienne Rook', role: 'Competing thief', appearance: 'Ivory travelling suit, black gloves, no visible luggage.', personality: 'Playful, brilliant, allergic to loyalty.', publicFace: 'A bored heiress travelling alone.', currentObjective: 'Acquire the ledger before the crew and sell it twice.', currentLocationId: 'observation-car', status: 'active', publicSummary: 'Vivienne recognizes professional thieves on sight and seems delighted to meet competition.' },
      { id: 'marshal-orren-kade', name: 'Orren Kade', role: 'Chief of rail security', appearance: 'Blue uniform, silver whistle, immaculate moustache.', personality: 'Methodical, courteous, relentless.', publicFace: 'A conductor concerned only with passenger safety.', currentObjective: 'Identify every person travelling under a false name.', currentLocationId: 'dining-car', status: 'active', publicSummary: 'Kade has begun a calm inspection that no one seems able to refuse.' },
    ],
  },
];
