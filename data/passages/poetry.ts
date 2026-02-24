import { Passage } from "./types";

export const poetryPassages: Passage[] = [
    {
        id: "poetry-001",
        categoryId: "poetry",
        tags: ["modernism", "fragmentation", "despair", "allusion", "urban"],
        title: "The Burial of the Dead (opening)",
        author: "T.S. Eliot",
        work: "The Waste Land (1922)",
        text: `April is the cruellest month, breeding
  Lilacs out of the dead land, mixing
  Memory and desire, stirring
  Dull roots with spring rain.
  Winter kept us warm, covering
  Earth in forgetful snow, feeding
  A little life with dried tubers.`,
        context:
            "The opening of Eliot's landmark modernist poem. He inverts the Chaucerian celebration of April, making spring an act of violence — forcing life back into numb, comfortable numbness. The participles ('breeding', 'mixing', 'stirring') keep the reader suspended, never landing on solid ground.",
        twists: [
            {
                label: "Wrong season",
                prompt:
                    "Rewrite it so that a traditionally joyful season (summer, harvest) becomes the cruel one. Keep the same grammatical rhythm of suspended participles.",
            },
            {
                label: "Urban voice",
                prompt:
                    "Translate the nature imagery into a city landscape — concrete, commutes, fluorescent light. Preserve the tone of reluctant awakening.",
            },
            {
                label: "Prose poem",
                prompt:
                    "Break the line breaks. Rewrite as a single paragraph of prose while keeping every image and the sense of dread intact.",
            },
        ],
    },
    {
        id: "poetry-002",
        categoryId: "poetry",
        tags: ["confessional", "identity", "rebirth", "darkness", "sylvia plath"],
        title: "Lady Lazarus (excerpt)",
        author: "Sylvia Plath",
        work: "Ariel (1965)",
        text: `Dying
  Is an art, like everything else.
  I do it exceptionally well.
  
  I do it so it feels like hell.
  I do it so it feels real.
  I guess you could say I've a call.`,
        context:
            "Plath's speaker turns death into performance and defiance. The flat, almost flippant tone ('I guess you could say') clashes with the weight of the subject — a technique Plath uses to expose both trauma and dark humor. The repetition of 'I do it' builds a grotesque résumé.",
        twists: [
            {
                label: "Different art",
                prompt:
                    "Replace 'dying' with another painful act (grieving, forgetting, waiting). Keep the boastful, matter-of-fact tone and the repetitive 'I do it' structure.",
            },
            {
                label: "Third person",
                prompt:
                    "Rewrite with 'she' instead of 'I'. Notice how the shift in perspective changes the emotional temperature — then adjust your language to match.",
            },
            {
                label: "Strip the irony",
                prompt:
                    "Rewrite the same content without the dark humor — make it sincere and vulnerable. What changes? What is lost?",
            },
        ],
    },
    {
        id: "poetry-003",
        categoryId: "poetry",
        tags: ["nature", "observation", "american", "minimalism", "mary oliver"],
        title: "The Summer Day",
        author: "Mary Oliver",
        work: "House of Light (1990)",
        text: `Who made the world?
  Who made the swan, and the black bear?
  Who made the grasshopper?
  This grasshopper, I mean —
  the one who has flung herself out of the grass,
  the one who is eating sugar out of my hand,
  who is moving her jaws back and forth instead of up and down —
  who is gazing around with her enormous and complicated eyes.`,
        context:
            "Oliver pivots from cosmic questions ('Who made the world?') to a single, precise grasshopper. The movement from universal to particular is her signature — the divine discovered in close attention. Notice how 'This grasshopper, I mean' is a self-correction that grounds the poem in the physical present.",
        twists: [
            {
                label: "Zoom in further",
                prompt:
                    "Start with a grand question, then narrow to something even smaller than Oliver's grasshopper — a mite, a seed, a grain of sand. Match her specificity of description.",
            },
            {
                label: "Urban creature",
                prompt:
                    "Replace the grasshopper with a city animal — a pigeon, a cockroach, a rat. Keep Oliver's tone of genuine wonder and careful observation.",
            },
            {
                label: "No questions",
                prompt:
                    "Remove all question marks. Rewrite as declarations. How does certainty change the spiritual feeling of the poem?",
            },
        ],
    },
    {
        id: "poetry-004",
        categoryId: "poetry",
        tags: ["war", "irony", "propaganda", "british", "wwi"],
        title: "Dulce et Decorum Est (final stanza)",
        author: "Wilfred Owen",
        work: "Poems (1920, posthumous)",
        text: `If in some smothering dreams you too could pace
  Behind the wagon that we flung him in,
  And watch the white eyes writhing in his face,
  His hanging face, like a devil's sick of sin;
  If you could hear, at every jolt, the blood
  Come gargling from the froth-corrupted lungs,
  Obscene as cancer, bitter as the cud
  Of vile, incurable sores on innocent tongues,
  My friend, you would not tell with such high zest
  To children ardent for some desperate glory,
  The old Lie: Dulce et decorum est
  Pro patria mori.`,
        context:
            "Owen addresses a propagandist directly — 'My friend' is bitterly ironic. He forces the reader to witness a gas attack death before delivering his counter-argument: the Latin tag (from Horace) meaning 'it is sweet and fitting to die for one's country' is exposed as a lie. The poem's power comes from making the reader see before they are told what to think.",
        twists: [
            {
                label: "Modern lie",
                prompt:
                    "Find a contemporary platitude or slogan you believe is false. Write a poem that forces the reader to witness a specific scene that contradicts it — deliver the lie at the end.",
            },
            {
                label: "Remove the address",
                prompt:
                    "Rewrite without 'My friend' — without any direct address. How does the poem change when the accuser disappears?",
            },
            {
                label: "Soft language",
                prompt:
                    "Rewrite Owen's imagery using the sanitized, euphemistic language of official war reporting ('collateral damage', 'neutralized'). What is the effect?",
            },
        ],
    },
    {
        id: "poetry-005",
        categoryId: "poetry",
        tags: ["love", "sonnet", "shakespeare", "time", "immortality"],
        title: "Sonnet 18",
        author: "William Shakespeare",
        work: "Sonnets (1609)",
        text: `Shall I compare thee to a summer's day?
  Thou art more lovely and more temperate.
  Rough winds do shake the darling buds of May,
  And summer's lease hath all too short a date.
  Sometime too hot the eye of heaven shines,
  And often is his gold complexion dimmed;
  And every fair from fair sometime declines,
  By chance, or nature's changing course, untrimmed;
  But thy eternal summer shall not fade,
  Nor lose possession of that fair thou ow'st,
  Nor shall death brag thou wand'rest in his shade,
  When in eternal lines to Time thou grow'st.
      So long as men can breathe, or eyes can see,
      So long lives this, and this gives life to thee.`,
        context:
            "Shakespeare sets up a simile only to immediately dismiss it — the beloved exceeds summer. The sonnet's real argument is about the power of the poem itself: verse defeats time and death. The couplet is quietly audacious: 'this gives life to thee' means the poem, not love, is what preserves the beloved.",
        twists: [
            {
                label: "Reject the comparison",
                prompt:
                    "Start with 'Shall I compare thee to ___?' — choose something unexpected (a subway, a broken appliance, a fever). Make the comparison genuine and specific before transcending it.",
            },
            {
                label: "Doubt the immortality",
                prompt:
                    "Rewrite the couplet so the speaker is uncertain — what if no one reads the poem? What if language dies? Let the doubt in.",
            },
            {
                label: "Prose argument",
                prompt:
                    "Write the same argument — 'you surpass summer, time will destroy summer, but this poem preserves you' — as a short prose paragraph. What does verse do that prose cannot?",
            },
        ],
    },
    {
        id: "poetry-006",
        categoryId: "poetry",
        tags: ["identity", "race", "american", "voice", "langston hughes"],
        title: "I, Too",
        author: "Langston Hughes",
        work: "The Weary Blues (1926)",
        text: `I, too, sing America.
  
  I am the darker brother.
  They send me to eat in the kitchen
  When company comes,
  But I laugh,
  And eat well,
  And grow strong.
  
  Tomorrow,
  I'll be at the table
  When company comes.
  Nobody'll dare
  Say to me,
  "Eat in the kitchen,"
  Then.`,
        context:
            "Hughes answers Whitman's 'I Hear America Singing' directly — the first line is a deliberate echo. The poem's power is in its plainness: short lines, simple words, present tense giving way to a confident future tense. 'Laugh' and 'eat well' are acts of survival and resistance, not passivity.",
        twists: [
            {
                label: "Change the room",
                prompt:
                    "Keep Hughes's structure (excluded now, at the table tomorrow) but set it in a different space of exclusion — a boardroom, a classroom, a family gathering. Use equally plain language.",
            },
            {
                label: "Add complexity",
                prompt:
                    "Rewrite with doubt — what if the speaker isn't sure tomorrow will come? Let ambivalence into the future tense while keeping the defiant surface.",
            },
            {
                label: "Whitman's voice",
                prompt:
                    "Write the 'reply' — Whitman's speaker hearing Hughes's poem and responding. Match Whitman's expansive, cataloguing style.",
            },
        ],
    },
    {
        id: "poetry-007",
        categoryId: "poetry",
        tags: ["grief", "loss", "lyric", "compressed", "emily dickinson"],
        title: "After great pain, a formal feeling comes",
        author: "Emily Dickinson",
        work: "Complete Poems (1960, posthumous)",
        text: `After great pain, a formal feeling comes —
  The Nerves sit ceremonious, like Tombs —
  The stiff Heart questions 'was it He, that bore,'
  And 'Yesterday, or Centuries before'?
  
  The Feet, mechanical, go round —
  A Wooden way
  Of Ground, or Air, or Ought —
  Regardless grown,
  A Quartz contentment, like a stone —
  
  This is the Hour of Lead —
  Remembered, if outlived,
  As Freezing persons, recollect the Snow —
  First — Chill — then Stupor — then the letting go —`,
        context:
            "Dickinson dissects grief not at its peak but in its aftermath — the numbness that follows catastrophe. She personifies body parts (Nerves, Heart, Feet) as if they have become strangers to each other. 'Quartz contentment' is one of her great strange images: contentment that is mineral, unfeeling, unorganic.",
        twists: [
            {
                label: "Name the pain",
                prompt:
                    "Dickinson leaves the grief unnamed. Rewrite the poem with a specific loss (a death, an ending, a diagnosis) and see what specificity gives and takes away.",
            },
            {
                label: "Restore sensation",
                prompt:
                    "Rewrite from the opposite direction — the moment grief thaws, feeling returns. Use Dickinson's compressed, dashed style.",
            },
            {
                label: "Sequence as list",
                prompt:
                    "Take Dickinson's closing sequence ('First — Chill — then Stupor — then the letting go') and expand each stage into its own stanza. Follow her logic through.",
            },
        ],
    },
    {
        id: "poetry-008",
        categoryId: "poetry",
        tags: ["narrative", "dramatic monologue", "power", "renaissance", "browning"],
        title: "My Last Duchess (opening)",
        author: "Robert Browning",
        work: "Dramatic Lyrics (1842)",
        text: `That's my last Duchess painted on the wall,
  Looking as if she were alive. I call
  That piece a wonder, now; Fra Pandolf's hands
  Worked busily a day, and there she stands.
  Will't please you sit and look at her? I said
  'Fra Pandolf' by design, for never read
  Strangers like you that pictured countenance,
  The depth and passion of its earnest glance,
  But to myself they turned (since none puts by
  The curtain I have drawn for you, but I)`,
        context:
            "A Duke addresses an envoy while showing off a portrait of his murdered wife — though 'murdered' is never said. Browning perfects the dramatic monologue: the speaker reveals himself through what he chooses to tell and how he tells it. The parenthetical '(since none puts by / The curtain I have drawn for you, but I)' is chilling — control extends even to who sees her face.",
        twists: [
            {
                label: "The envoy replies",
                prompt:
                    "Write the envoy's private letter after leaving the Duke, in the same era and formality. What did he actually understand? What will he report?",
            },
            {
                label: "Modern monologue",
                prompt:
                    "Write a contemporary dramatic monologue where a speaker inadvertently reveals something dark about themselves while showing off an object or place. Let the reader understand more than the speaker intends.",
            },
            {
                label: "The Duchess speaks",
                prompt:
                    "Give the Duchess a monologue. She has heard everything. She knows what is coming. Use the same pentameter-ish rhythm but a completely different emotional register.",
            },
        ],
    },
    {
        id: "poetry-009",
        categoryId: "poetry",
        tags: ["metaphysical", "wit", "love", "conceit", "john donne"],
        title: "A Valediction: Forbidding Mourning (excerpt)",
        author: "John Donne",
        work: "Poems (1633, posthumous)",
        text: `If they be two, they are two so
  As stiff twin compasses are two;
  Thy soul, the fixed foot, makes no show
  To move, but doth, if th' other do.
  
  And though it in the center sit,
  Yet when the other far doth roam,
  It leans and hearkens after it,
  And grows erect, as that comes home.
  
  Such wilt thou be to me, who must,
  Like th' other foot, obliquely run;
  Thy firmness makes my circle just,
  And makes me end where I begun.`,
        context:
            "Donne compares two lovers separated by travel to the two legs of a compass (a drawing instrument). The 'fixed foot' stays home while the other 'roams' — yet they remain connected, and the roaming foot makes a perfect circle only because of the fixed one's steadiness. This is the Metaphysical 'conceit' at its most precise: a wildly unlikely comparison held rigorously to its logical end.",
        twists: [
            {
                label: "Sustained conceit",
                prompt:
                    "Choose a completely unlikely object (a Wi-Fi router, a power strip, a pair of scissors) and build a love poem around it. Commit fully — follow every implication of the comparison.",
            },
            {
                label: "Break the conceit",
                prompt:
                    "Start with Donne's compass image but let it fail halfway through — the metaphor breaks down. Write about the moment when no comparison is adequate.",
            },
            {
                label: "The fixed foot",
                prompt:
                    "Rewrite from the perspective of the one who stays — the 'fixed foot.' What does it feel like to be the one who does not move?",
            },
        ],
    },
    {
        id: "poetry-010",
        categoryId: "poetry",
        tags: ["surrealism", "childhood", "memory", "image", "neruda"],
        title: "Tonight I Can Write (excerpt)",
        author: "Pablo Neruda",
        work: "Twenty Love Poems and a Song of Despair (1924)",
        text: `Tonight I can write the saddest lines.
  
  I loved her, and sometimes she loved me too.
  
  Through nights like this one I held her in my arms.
  I kissed her again and again under the endless sky.
  She loved me, sometimes I loved her too.
  How could one not have loved her great still eyes.
  
  Tonight I can write the saddest lines.
  To think that I do not have her. To feel that I have lost her.
  To hear the immense night, still more immense without her.
  And the verse falls to the soul like dew to the pasture.`,
        context:
            "Neruda's poem is built on repetition and reversal — 'I loved her, and sometimes she loved me too' flips to 'She loved me, sometimes I loved her too,' subtly changing who held more. The refrain 'Tonight I can write the saddest lines' is both announcement and permission — as if sadness requires conditions to be spoken.",
        twists: [
            {
                label: "Invert the emotion",
                prompt:
                    "Write 'Tonight I can write the happiest lines' — but use Neruda's same structure of reversal and repetition. Make happiness feel as complicated as his grief.",
            },
            {
                label: "Remove the self",
                prompt:
                    "Rewrite without 'I' — find a way to express the same grief and the same night in purely external images. No speaker, only the world.",
            },
            {
                label: "Change the refrain",
                prompt:
                    "Keep Neruda's structure but change the opening refrain to a different impossible statement ('Tonight I can say nothing.' / 'Tonight everything is easy.'). Let the refrain reframe every line.",
            },
        ],
    },
    {
        id: "poetry-011",
        categoryId: "poetry",
        tags: ["haiku", "japanese", "nature", "silence", "basho"],
        title: "The Old Pond",
        author: "Matsuo Bashō",
        work: "Composed 1686",
        text: `An old silent pond.
  A frog jumps into the pond—
  Splash! Silence again.`,
        context:
            "The most famous haiku in Japanese literature. Bashō creates a before-and-after structure: the pond's ancient stillness, a single disruptive event, then a return to silence that is now somehow different — marked by what broke it. The poem is about how a moment of sound makes silence more audible. Everything unnecessary is gone.",
        twists: [
            {
                label: "Urban haiku",
                prompt:
                    "Write a haiku with Bashō's before/disruption/after structure set entirely in a city. No nature imagery allowed. Find the equivalent of the frog.",
            },
            {
                label: "Expand it",
                prompt:
                    "Take Bashō's three lines and expand them into a 10-line poem without losing the essential movement — stillness, break, renewed stillness. Add only what the haiku couldn't hold.",
            },
            {
                label: "Wrong scale",
                prompt:
                    "Rewrite with a catastrophically large disruption (an earthquake, a crowd, a storm) and then restore silence. Does the structure still work at a different scale?",
            },
        ],
    },
    {
        id: "poetry-012",
        categoryId: "poetry",
        tags: ["contemporary", "grief", "fragmentation", "american", "frank bidart"],
        title: "If See No End In Is (excerpt)",
        author: "Frank Bidart",
        work: "Metaphysical Dog (2013)",
        text: `Nightmare of the body.
  The labyrinthine body.
  
  Made then unmade then
  made then unmade then
  made then unmade then made.
  
  To be made is
  to be unmade.
  
  To be made
  is to be, for a time,
  not unmade.`,
        context:
            "Bidart works in extremity — his lines are often broken mid-thought, capitalized, fragmented. Here repetition becomes a kind of formal enactment of the body's own cycles of making and unmaking (birth, illness, aging, death). The poem refuses to choose between horror and acceptance — it holds both.",
        twists: [
            {
                label: "Repetition as form",
                prompt:
                    "Write a short poem where the structural repetition IS the argument. Choose an idea that is cyclical (waking/sleeping, forgetting/remembering) and let the repeated line enact it.",
            },
            {
                label: "Add flesh",
                prompt:
                    "Bidart abstracts the body. Rewrite with specific physical detail — a particular body, a particular illness or moment. See if the abstraction survives contact with the specific.",
            },
            {
                label: "Resolve it",
                prompt:
                    "Bidart refuses resolution. Add a final stanza that attempts to conclude. Then ask: does the resolution feel earned or false?",
            },
        ],
    },
];
