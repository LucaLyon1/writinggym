import { Passage } from "./types";

export const dialoguePassages: Passage[] = [
  {
    id: "hemingway-hills",
    categoryId: "dialogue",
    tags: ["subtext", "minimalism", "power-dynamics"],
    title: "Hills Like White Elephants",
    author: "Ernest Hemingway",
    work: "Men Without Women (1927)",
    text: "WOMAN: They look like white elephants.\nMAN: I've never seen one.\nNARRATOR: The man drank his beer.\nWOMAN: No, you wouldn't have.\nMAN: I might have. Just because you say I wouldn't have doesn't prove anything.",
    context:
      "Hemingway's dialogue is entirely about what isn't being said. Neither character names the subject of their argument. The white elephants aren't white elephants. Read what the subtext is doing underneath each line.",
    twists: [
      {
        label: "Name the thing",
        prompt:
          "Rewrite it so the characters say exactly what they mean. No subtext, no evasion. Notice what direct speech costs the scene.",
      },
      {
        label: "Add an action beat",
        prompt:
          "Between each line of dialogue, add one small physical action — a gesture, a look, a movement. Don't explain the emotion. Let the action carry it.",
      },
      {
        label: "Change who has the power",
        prompt:
          "Rewrite it so the man is uncertain and the woman is steady. Same words, different power dynamic.",
      },
    ],
  },
  {
    id: "pinter-betrayal",
    categoryId: "dialogue",
    tags: ["subtext", "minimalism", "restraint"],
    title: "Betrayal",
    author: "Harold Pinter",
    work: "Betrayal (1978)",
    text: "EMMA: How are you?\nJERRY: All right.\nEMMA: You look well.\nJERRY: Well, I'm not.\nEMMA: I'm sorry.\nJERRY: It's all right. I don't suppose I look well, actually.",
    context:
      "Pinter strips dialogue to almost nothing — and what's left is everything. Each 'all right' means something different. The pause is the sentence that matters most. Notice how much is communicated through contradiction.",
    twists: [
      {
        label: "Extend it",
        prompt:
          "Add four more exchanges, keeping the same clipped rhythm and the same feeling of people not quite reaching each other.",
      },
      {
        label: "Add stage directions",
        prompt:
          "Insert physical actions between the lines — not emotional descriptions, only movements. What do they reveal?",
      },
      {
        label: "Make them strangers",
        prompt:
          "Rewrite this exchange between two people who have never met. Does the strangeness change what the words mean?",
      },
    ],
  },
  {
    id: "austen-persuasion-dialogue",
    categoryId: "dialogue",
    tags: ["subtext", "restraint"],
    title: "Persuasion",
    author: "Jane Austen",
    work: "Persuasion (1817)",
    text: "CAPTAIN BENWICK: You are a good soul, and I hope your cousin may be half as lucky.\nNARRATOR: His cousin was gone, and Anne beginning to arrange her thoughts. She was ashamed of herself, quite ashamed of having been able to forget how much had passed between them, how much might still be passing through his mind.",
    context:
      "Austen uses dialogue as the outer shell and interiority as the real action. The compliment lands — and immediately sends Anne inward. Notice how the spoken line and the thought are in completely different registers.",
    twists: [
      {
        label: "Stay outside",
        prompt:
          "Rewrite it without any access to Anne's interior. Only what is visible — what she does, how she looks. What gets lost?",
      },
      {
        label: "Lengthen the interior",
        prompt:
          "Expand Anne's thought into a full paragraph. Where does her mind go? What memory surfaces?",
      },
      {
        label: "Make the compliment cruel",
        prompt:
          "Rewrite it so Captain Benwick's line, meant kindly, lands as a wound. Don't change the line — change the context around it.",
      },
    ],
  },
  {
    id: "chekhov-three-sisters",
    categoryId: "dialogue",
    tags: ["subtext", "repetition"],
    title: "Three Sisters",
    author: "Anton Chekhov",
    work: "Three Sisters (1901)",
    text: "MASHA: Do you love me?\nVERSHININ: I love you. I love your eyes, the way you move... I dream about them. A splendid, wonderful woman!\nMASHA: When you talk to me like that, for some reason I laugh, though I'm frightened. Don't say it again, I beg you... [whispering] But go on, say it...",
    context:
      "Chekhov catches the contradiction of desire in real time. Masha says stop and says continue in the same breath. The stage direction — 'half audibly' — makes the reversal physical: the voice drops as the want rises. Dialogue as self-contradiction.",
    twists: [
      {
        label: "Remove the contradiction",
        prompt:
          "Rewrite it so Masha only says stop — and means it. Or only says continue. What happens to the tension when the character is consistent?",
      },
      {
        label: "Strip the declarations",
        prompt:
          "Rewrite the exchange without anyone saying 'I love you'. The feeling must be just as clear, communicated entirely through other words.",
      },
      {
        label: "Make it comic",
        prompt:
          "Rewrite the same dynamic — someone asking for something, being given it, panicking, then asking for more — but in a completely trivial context.",
      },
    ],
  },
  {
    id: "mccarthy-no-country",
    categoryId: "dialogue",
    tags: ["repetition", "power-dynamics", "withholding"],
    title: "No Country for Old Men",
    author: "Cormac McCarthy",
    work: "No Country for Old Men (2005)",
    text: "CHIGURH: What's the most you ever lost on a coin toss?\nOWNER: Sir?\nCHIGURH: The most. You ever lost. On a coin toss.\nOWNER: I don't know. I couldn't say.\nCHIGURH: Call it.\nOWNER: Call it?\nCHIGURH: Yes.\nOWNER: For what?\nCHIGURH: Just call it.\nOWNER: Well. We need to know what we're calling it for here.\nCHIGURH: You need to call it. I can't call it for you. It wouldn't be fair.",
    context:
      "McCarthy writes dialogue as a trap closing. Chigurh's repetition — short, patient, absolute — turns a coin toss into a death sentence. The gas station owner's responses show a man slowly realizing he's not in a normal conversation. The horror is in the politeness.",
    twists: [
      {
        label: "Give the victim power",
        prompt:
          "Rewrite it so the gas station owner refuses to play. He doesn't call it. What does Chigurh do? What does the scene become?",
      },
      {
        label: "Remove the threat",
        prompt:
          "Rewrite the same exchange — the same rhythms, the same insistence — between two friends. No danger. Does the structure still produce unease?",
      },
      {
        label: "Add what's unspoken",
        prompt:
          "Between each line, write one sentence of what the gas station owner is thinking but cannot say. Interior against exterior.",
      },
    ],
  },
  {
    id: "dostoevsky-karamazov",
    categoryId: "dialogue",
    tags: ["repetition", "compression"],
    title: "The Brothers Karamazov",
    author: "Fyodor Dostoevsky",
    work: "The Brothers Karamazov (1880)",
    text: "IVAN: Is there a God, or not?\nALYOSHA: There is no God.\nIVAN: Alyosha, does God exist?\nALYOSHA: God does exist.\nIVAN: Ivan, is there immortality of some sort, just a little, just a tiny bit?\nALYOSHA: There is no immortality either.\nIVAN: None at all?\nALYOSHA: None at all.\nIVAN: Complete zero?\nALYOSHA: Complete zero.",
    context:
      "Dostoevsky stages the largest questions human beings can ask as rapid-fire dialogue — almost catechism. The repetition doesn't dilute the enormity; it amplifies it. Each echo strips away another layer of evasion until nothing is left but the bare answer.",
    twists: [
      {
        label: "Slow it down",
        prompt:
          "Rewrite the exchange with pauses, with hesitation, with long sentences between the questions. What does slowness do to the weight of the answers?",
      },
      {
        label: "Make the questions small",
        prompt:
          "Use the same rapid-fire structure — the same insistence, the same bare answers — but about something completely mundane. Does the form still produce intensity?",
      },
      {
        label: "Let someone dodge",
        prompt:
          "Rewrite it so one of the brothers refuses to answer directly. Evasion instead of declaration. What does that cost the scene?",
      },
    ],
  },
  {
    id: "carver-what-we-talk",
    categoryId: "dialogue",
    tags: ["first-person", "repetition", "minimalism"],
    title: "What We Talk About When We Talk About Love",
    author: "Raymond Carver",
    work: "What We Talk About When We Talk About Love (1981)",
    text: "'There was a time when I thought I loved my first wife more than life itself. But now I hate her guts. I do. How do you explain that? What happened to that love? What happened to it, is what I'd like to know. I wish someone could tell me.'",
    context:
      "Carver gives us a man performing bewilderment out loud. The repetitions — 'what happened to that love? What happened to it' — aren't rhetorical. He genuinely doesn't know. The dialogue is a man thinking in real time, and the thinking leads nowhere.",
    twists: [
      {
        label: "Give him an answer",
        prompt:
          "Have someone in the room actually answer the question. What would that answer be? Does answering it kill the scene?",
      },
      {
        label: "Remove the repetition",
        prompt:
          "Rewrite it so he says it once, cleanly. No circling, no restating. What's lost when you take away the groping quality of the speech?",
      },
      {
        label: "Make it private",
        prompt:
          "Rewrite it as interior monologue — the same words, but thought, not spoken. How does removing the audience change it?",
      },
    ],
  },
  {
    id: "albee-woolf",
    categoryId: "dialogue",
    tags: ["juxtaposition", "power-dynamics", "irony"],
    title: "Who's Afraid of Virginia Woolf?",
    author: "Edward Albee",
    work: "Who's Afraid of Virginia Woolf? (1962)",
    text: "MARTHA: I swear, if you existed I'd divorce you.\nGEORGE: Well, just stay on your feet, that's all. These people are your guests, you know, and...\nMARTHA: I can't even see you... I haven't been able to see you for years.\nGEORGE: If you pass out, or throw up, or something...\nMARTHA: I mean, you're a blank, a cipher...\nGEORGE: ...and try to keep your clothes on, too.",
    context:
      "Albee writes two simultaneous conversations occupying the same space. Martha is delivering a devastating verdict on their marriage; George is giving practical instructions about hosting. Neither responds to what the other is actually saying. The dialogue is two monologues colliding.",
    twists: [
      {
        label: "Make them listen",
        prompt:
          "Rewrite it so George actually responds to what Martha is saying. What happens when the deflection stops?",
      },
      {
        label: "Reverse the weapons",
        prompt:
          "Rewrite it so George is the one delivering existential blows and Martha is deflecting into practicalities. Does the dynamic change?",
      },
      {
        label: "Add a witness",
        prompt:
          "Rewrite the scene with a third person in the room, watching. Give us their perspective — what does this exchange look like from outside?",
      },
    ],
  },
  {
    id: "ishiguro-remains",
    categoryId: "dialogue",
    tags: ["subtext", "restraint", "withholding"],
    title: "The Remains of the Day",
    author: "Kazuo Ishiguro",
    work: "The Remains of the Day (1989)",
    text: "MISS KENTON: Do you think, Mr. Stevens, we could have been happy together? You and I?\nSTEVENS: I'm sorry, Miss Kenton, I don't quite follow you.\nMISS KENTON: Oh, never mind. It was just a thought. A foolish thought.",
    context:
      "Ishiguro compresses an entire unlived life into three exchanges. Miss Kenton reaches across years of repression, and Stevens retreats into incomprehension — real or performed, we can't tell. 'I don't quite follow you' is the most devastating line in the novel. The dialogue is about the impossibility of saying the real thing.",
    twists: [
      {
        label: "Let him answer",
        prompt:
          "Rewrite it so Stevens actually responds to what Miss Kenton is asking. Honestly. What does he say? What does it cost him?",
      },
      {
        label: "Extend the silence",
        prompt:
          "Add what happens after — the pause, the room, the bodies. No more dialogue. Only the physical space after the words fail.",
      },
      {
        label: "Make her insist",
        prompt:
          "Rewrite it so Miss Kenton doesn't retreat. She asks again. And again. What does persistence do to the scene?",
      },
    ],
  },
];
