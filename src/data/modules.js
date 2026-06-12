function videos(...urls) {
  return urls.map((url, i) => ({
    id: `v${i + 1}`,
    title: `Video ${i + 1}`,
    url,
    completed: false,
  }))
}

const modules = [
  {
    id: 'm1',
    title: 'Introduction to English',
    subTopics: [
      { id: 'm1-s1', title: 'Alphabet Pronunciation and Sounds', videos: videos('https://www.youtube.com/watch?v=Ft17a7tyjMM'), isFullyCompleted: false },
      { id: 'm1-s2', title: 'Basic Vocabulary', videos: videos('https://www.youtube.com/watch?v=F30R0tDIXP0', 'https://www.youtube.com/watch?v=xRSmuvJZf_Y'), isFullyCompleted: false },
      { id: 'm1-s3', title: 'Nouns and Pronouns', videos: videos('https://www.youtube.com/watch?v=chjmnCSPnbw'), isFullyCompleted: false },
      { id: 'm1-s4', title: 'Articles', videos: videos('https://www.youtube.com/watch?v=BPvQuN3oo0U'), isFullyCompleted: false },
      { id: 'm1-s5', title: 'Verbs, Modal Verbs, Regular and Irregular Verbs', videos: videos('https://www.youtube.com/watch?v=2kOBaf9VmVE', 'https://www.youtube.com/watch?v=BT3JbwlpQxU'), isFullyCompleted: false },
      { id: 'm1-s6', title: 'Adjectives and Adverbs', videos: videos('https://www.youtube.com/watch?v=T737POUsPmM'), isFullyCompleted: false },
      { id: 'm1-s7', title: 'Prepositions', videos: videos('https://www.youtube.com/watch?v=92XBCRYZ1S8', 'https://www.youtube.com/watch?v=fRrVkXG0-v4'), isFullyCompleted: false },
      { id: 'm1-s8', title: 'Tenses', videos: videos('https://www.youtube.com/watch?v=Ljjiw9mC_Cg', 'https://www.youtube.com/watch?v=Z7jiJpW_-C0'), isFullyCompleted: false },
      { id: 'm1-s9', title: 'Punctuation', videos: videos('https://www.youtube.com/watch?v=4IqlgGLV1XQ'), isFullyCompleted: false },
      { id: 'm1-s10', title: 'Naming of Dates and Time', videos: videos('https://youtube.com/playlist?list=PLaVRwH3Ap6bhDpL_wMhhVGe5QnXz7119e'), isFullyCompleted: false },
      { id: 'm1-s11', title: 'Coordinating Conjunctions', videos: videos('https://www.youtube.com/watch?v=JJ4n0jr8qX8'), isFullyCompleted: false },
      { id: 'm1-s12', title: 'Idioms', videos: videos('https://youtube.com/playlist?list=PLhPfBpTj6VpRFRz3VbqM25rIk3Pi7EmhO'), isFullyCompleted: false },
      { id: 'm1-s13', title: 'Phrasal Verbs', videos: videos('https://www.youtube.com/watch?v=r7VKVXbaj_Y'), isFullyCompleted: false },
      { id: 'm1-s14', title: 'Simple Sentence Structure (Subject-Verb-Object)', videos: videos('https://www.youtube.com/watch?v=9P1Cl7DZSYs', 'https://www.youtube.com/watch?v=jul2urONzOQ'), isFullyCompleted: false },
      { id: 'm1-s15', title: 'Sentence Joining and Construction', videos: videos('https://www.youtube.com/watch?v=18yMMr_WUHU', 'https://www.youtube.com/watch?v=GkVbD6mKP3w'), isFullyCompleted: false },
      { id: 'm1-s16', title: 'Active and Passive Voice', videos: videos('https://www.youtube.com/watch?v=fo46yFWIJzU', 'https://www.youtube.com/watch?v=5jHiG3irHa4'), isFullyCompleted: false },
      { id: 'm1-s17', title: 'Most Common Grammatical Errors', videos: videos('https://www.youtube.com/watch?v=9Pgg-sTY2vo', 'https://www.youtube.com/watch?v=n-NMa51WI48'), isFullyCompleted: false },
      { id: 'm1-s18', title: 'Other Terms (Pangrams, Language Quirks)', videos: videos('https://www.youtube.com/watch?v=QYlVJlmjLEc', 'https://www.youtube.com/watch?v=MlCs8X26anw', 'https://www.youtube.com/watch?v=8laYlyAFd0o'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm2',
    title: 'Greetings and Introductions',
    subTopics: [
      { id: 'm2-s1', title: 'Greetings', videos: videos('https://www.youtube.com/watch?v=amxeGGNwwzE', 'https://www.youtube.com/watch?v=VCb5qfNgNro'), isFullyCompleted: false },
      { id: 'm2-s2', title: 'Describing Yourself', videos: videos('https://www.youtube.com/watch?v=1mueUlgvBHo', 'https://www.youtube.com/watch?v=6f5bmwDGvss'), isFullyCompleted: false },
      { id: 'm2-s3', title: 'Handling Basic Questions', videos: videos('https://www.youtube.com/watch?v=wkFkWdGiLrQ', 'https://www.youtube.com/watch?v=Ms6qzk6-prU', 'https://www.youtube.com/watch?v=EW4dEzfBst0'), isFullyCompleted: false },
      { id: 'm2-s4', title: 'Language of Politeness', videos: videos('https://www.youtube.com/watch?v=5m-C5mwpmxU', 'https://www.youtube.com/watch?v=aUBPWT-D5_U', 'https://www.youtube.com/watch?v=rZkpJBZt_0U'), isFullyCompleted: false },
      { id: 'm2-s5', title: 'Importance of Please, Thank You and Excuse Me', videos: videos('https://www.youtube.com/watch?v=HINOdaZ0e3o'), isFullyCompleted: false },
      { id: 'm2-s6', title: 'Describing Your Family', videos: videos('https://www.youtube.com/watch?v=R49zGknt7EE', 'https://www.youtube.com/watch?v=vXI2lRCnTKw'), isFullyCompleted: false },
      { id: 'm2-s7', title: 'Talking About Your Hobbies and Interests', videos: videos('https://www.youtube.com/watch?v=hoyhPZDp3dE', 'https://www.youtube.com/watch?v=Tj1w86bw4EM', 'https://www.youtube.com/watch?v=oUD2gUmdzeI'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm3',
    title: 'Questions',
    subTopics: [
      { id: 'm3-s1', title: 'Wh-Questions', videos: videos('https://www.youtube.com/watch?v=mLefVAvKsRk'), isFullyCompleted: false },
      { id: 'm3-s2', title: 'Yes/No Questions', videos: videos('https://www.youtube.com/watch?v=nbqI7ukGOZQ', 'https://www.youtube.com/watch?v=wHgCXSOlWlo'), isFullyCompleted: false },
      { id: 'm3-s3', title: 'Tag Questions', videos: videos('https://www.youtube.com/watch?v=DJFQPnZ9-Uo', 'https://www.youtube.com/watch?v=beCqCLgbrnc'), isFullyCompleted: false },
      { id: 'm3-s4', title: 'Responding to Questions', videos: videos('https://www.youtube.com/watch?v=0xt9fYuVZ6A', 'https://www.youtube.com/watch?v=EA8p7Xfk8ds'), isFullyCompleted: false },
      { id: 'm3-s5', title: 'Hypothetical Questions and Negative Questions', videos: videos('https://www.youtube.com/watch?v=vXp0ETWXbWo', 'https://www.youtube.com/watch?v=D-CbIhuRMi4'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm4',
    title: 'Everyday Conversations',
    subTopics: [
      { id: 'm4-s1', title: 'Making Small Talk (Weather, Hobbies, Family)', videos: videos('https://www.youtube.com/watch?v=1mueUlgvBHo', 'https://www.youtube.com/watch?v=xmx07H3sn1w', 'https://www.youtube.com/watch?v=BddvcGLVnR8'), isFullyCompleted: false },
      { id: 'm4-s2', title: 'Everyday Activities', videos: videos('https://www.youtube.com/watch?v=bq6GBbh3uhU', 'https://www.youtube.com/watch?v=ecF1y2bI2T4'), isFullyCompleted: false },
      { id: 'm4-s3', title: 'Routine', videos: videos('https://www.youtube.com/watch?v=0AIlXB2XNBM'), isFullyCompleted: false },
      { id: 'm4-s4', title: 'Real-Life Scenarios', videos: videos('https://www.youtube.com/watch?v=txcyuBCSTq4', 'https://www.youtube.com/watch?v=LFAmeYrB3UA'), isFullyCompleted: false },
      { id: 'm4-s5', title: 'Expressing Likes and Dislikes', videos: videos('https://www.youtube.com/shorts/Ly_dceUrMsI', 'https://www.youtube.com/shorts/ueZR266NR_Y', 'https://www.youtube.com/shorts/mgGVEJSh790', 'https://www.youtube.com/shorts/8PUu8lcqKtQ'), isFullyCompleted: false },
      { id: 'm4-s6', title: 'Understanding Cultural Differences', videos: videos('https://www.youtube.com/watch?v=FcHjpnDFAUY', 'https://www.youtube.com/watch?v=Al3L6cnCmMU', 'https://www.youtube.com/watch?v=LI57EB_T38c', 'https://www.youtube.com/watch?v=aA3O-mczM_8', 'https://www.youtube.com/watch?v=8OzQ3FGSmoo'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm5',
    title: 'Talking About Daily Activities',
    subTopics: [
      { id: 'm5-s1', title: 'Daily Routines', videos: videos('https://www.youtube.com/watch?v=k9cbaZD3iZA', 'https://www.youtube.com/watch?v=xRSmuvJZf_Y'), isFullyCompleted: false },
      { id: 'm5-s2', title: 'Verbs Related to Daily Activities', videos: videos('https://www.youtube.com/watch?v=wlDITPrP8Nw', 'https://www.youtube.com/watch?v=FfLm41o3UQI'), isFullyCompleted: false },
      { id: 'm5-s3', title: 'Talking About Past, Present and Future Activities', videos: videos('https://www.youtube.com/watch?v=jn-S81Gme-A', 'https://www.youtube.com/watch?v=WbtrD-As0Nw', 'https://www.youtube.com/watch?v=6FSnfS7-ohM'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm6',
    title: 'Expressing Need and Opinions',
    subTopics: [
      { id: 'm6-s1', title: 'Making Requests and Giving Instructions', videos: videos('https://www.youtube.com/watch?v=TrCsLOqOuSg'), isFullyCompleted: false },
      { id: 'm6-s2', title: 'Modal Verbs to Set the Tone', videos: videos('https://www.youtube.com/watch?v=lXA-DQ2gNOs', 'https://www.youtube.com/watch?v=36wG9pSYu7Q', 'https://www.youtube.com/watch?v=2kOBaf9VmVE', 'https://www.youtube.com/watch?v=dbGEAdGN8fs'), isFullyCompleted: false },
      { id: 'm6-s3', title: 'Expressing Agreement and Disagreement', videos: videos('https://www.youtube.com/watch?v=OvWDWx8Rshw', 'https://www.youtube.com/watch?v=phgjouv0BUA', 'https://www.youtube.com/watch?v=K119PfYh-KY'), isFullyCompleted: false },
      { id: 'm6-s4', title: 'Asking for Help and Offering Assistance', videos: videos('https://www.youtube.com/watch?v=-H5K3LZ2yew', 'https://www.youtube.com/watch?v=B-sKynmR_Ko', 'https://www.youtube.com/watch?v=XlmKqkZkfqI', 'https://www.youtube.com/watch?v=J2t1Ncy6Yg0'), isFullyCompleted: false },
      { id: 'm6-s5', title: 'English for Different Moods', videos: videos('https://www.youtube.com/watch?v=p_ylzGfHKOs', 'https://www.youtube.com/watch?v=CuaY4qe4V34', 'https://www.youtube.com/watch?v=so9l8homNCE'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm7',
    title: 'New Gen Vocab',
    subTopics: [
      { id: 'm7-s1', title: 'Internet Slangs', videos: videos('https://www.youtube.com/watch?v=CYsxdnq_czQ', 'https://www.youtube.com/shorts/xOwKvHKIafI', 'https://www.youtube.com/shorts/juVef28GATA', 'https://www.youtube.com/shorts/cXe4XCXzwuo', 'https://www.youtube.com/watch?v=SCO02frD_1I'), isFullyCompleted: false },
      { id: 'm7-s2', title: 'Informal Contractions', videos: videos('https://www.youtube.com/watch?v=SvEUTdKkdIw', 'https://www.youtube.com/watch?v=jdNGn57MPrY'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm8',
    title: 'Pronunciation Mistakes',
    subTopics: [
      { id: 'm8-s1', title: 'The Basics of Pronouncing Words', videos: videos('https://www.youtube.com/watch?v=PiNN-HmHu7A', 'https://www.youtube.com/watch?v=BAJMNQXzrgg', 'https://www.youtube.com/watch?v=0wPe2pkwVfY'), isFullyCompleted: false },
      { id: 'm8-s2', title: 'Brands Mispronounced', videos: videos('https://www.youtube.com/watch?v=6RMD87AiHV8', 'https://www.youtube.com/watch?v=D9fLc2RaOeQ', 'https://www.youtube.com/watch?v=akclITsS6gw'), isFullyCompleted: false },
      { id: 'm8-s3', title: 'Common Food Items Mispronunciations', videos: videos('https://www.youtube.com/watch?v=iRUWzeEGI44'), isFullyCompleted: false },
      { id: 'm8-s4', title: 'Commonly Mispronounced Day to Day Words', videos: videos('https://www.youtube.com/watch?v=5QE76OkYA4k', 'https://www.youtube.com/watch?v=r5TkSyo5p-c', 'https://www.youtube.com/watch?v=p9d1cy5-rjc', 'https://www.youtube.com/watch?v=OTHFOiRDmw8'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm9',
    title: 'English Advanced',
    subTopics: [
      { id: 'm9-s1', title: 'Advanced Idioms', videos: videos('https://www.youtube.com/watch?v=JKD4Z-AUqGo', 'https://www.youtube.com/watch?v=kmxoPFPvveQ'), isFullyCompleted: false },
      { id: 'm9-s2', title: 'Advanced Phrasal Verbs', videos: videos('https://www.youtube.com/watch?v=qKEiuAiKAgA', 'https://www.youtube.com/watch?v=ERpJiqHaW94'), isFullyCompleted: false },
      { id: 'm9-s3', title: 'Confusing Word Pairs', videos: videos('https://www.youtube.com/watch?v=KH1IcB-LnJw', 'https://www.youtube.com/watch?v=81uprEp79_Q', 'https://www.youtube.com/watch?v=7fuP9DeLxTk'), isFullyCompleted: false },
      { id: 'm9-s4', title: 'Commonly Misused Words', videos: videos('https://www.youtube.com/watch?v=S-qnItGNuGM', 'https://www.youtube.com/watch?v=dPxANCXnfCM', 'https://www.youtube.com/watch?v=kT7z9sQbnDw'), isFullyCompleted: false },
      { id: 'm9-s5', title: 'Quantifiers', videos: videos('https://www.youtube.com/watch?v=2rH3zGr0u1g', 'https://www.youtube.com/watch?v=XxGzMZZ_Hjc', 'https://www.youtube.com/watch?v=MlCs8X26anw', 'https://www.youtube.com/watch?v=PLhAzAymMsY'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm10',
    title: 'Business English',
    subTopics: [
      { id: 'm10-s1', title: 'General English vs Business English', videos: videos('https://www.youtube.com/watch?v=b3_OxK14YPc', 'https://www.youtube.com/watch?v=yGKWSxxlaA0', 'https://www.youtube.com/watch?v=I-DiPTWUxyg'), isFullyCompleted: false },
      { id: 'm10-s2', title: 'Key Terms and Phrases in Emails', videos: videos('https://www.youtube.com/watch?v=1XctnF7C74s', 'https://www.youtube.com/watch?v=Sw61Uu8ftII', 'https://www.youtube.com/watch?v=pIHRGFN-mXI'), isFullyCompleted: false },
      { id: 'm10-s3', title: 'Key Terms and Phrases in Business', videos: videos('https://www.youtube.com/watch?v=ccerF0fWVCg', 'https://www.youtube.com/watch?v=ZGahN0pFMKY', 'https://www.youtube.com/watch?v=T2hOSdvaiRk'), isFullyCompleted: false },
      { id: 'm10-s4', title: 'Professional Communication Skills', videos: videos('https://www.youtube.com/watch?v=fS8--o5n8os', 'https://www.youtube.com/watch?v=aUBPWT-D5_U', 'https://www.youtube.com/watch?v=LI57EB_T38c', 'https://www.youtube.com/watch?v=WESGDi_ajUU'), isFullyCompleted: false },
      { id: 'm10-s5', title: 'Meetings and Negotiations', videos: videos('https://www.youtube.com/watch?v=lQJKmRD1gYg', 'https://www.youtube.com/watch?v=MXFpOWDAhvM', 'https://www.youtube.com/watch?v=O3kg_dWkmCA'), isFullyCompleted: false },
      { id: 'm10-s6', title: 'Job Interviews', videos: videos('https://www.youtube.com/watch?v=kayOhGRcNt4', 'https://www.youtube.com/watch?v=EzGH3hZuJVk', 'https://www.youtube.com/watch?v=1TrHOpyEbps', 'https://www.youtube.com/watch?v=DsYWYlGBD1c', 'https://www.youtube.com/watch?v=-ezFNrWMTlc'), isFullyCompleted: false },
      { id: 'm10-s7', title: 'Small Talk in Business Context', videos: videos('https://www.youtube.com/watch?v=lMNwOO6fkgY', 'https://www.youtube.com/watch?v=Q8HKpV1RfPU', 'https://www.youtube.com/watch?v=IfajojQ_r5o', 'https://www.youtube.com/watch?v=4zXys7i8Zrc'), isFullyCompleted: false },
      { id: 'm10-s8', title: 'Email and Written Correspondence', videos: videos('https://www.youtube.com/watch?v=moIucWGgvMc', 'https://www.youtube.com/watch?v=SBTojgEHl90', 'https://www.youtube.com/watch?v=v00DUIxRX0c', 'https://www.youtube.com/watch?v=IRG-YubP1rw'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm11',
    title: 'Comprehension Passages',
    subTopics: [
      { id: 'm11-s1', title: "Tommy and Rosie's Forest Adventure", videos: videos('https://www.youtube.com/watch?v=srL0Vb2zGRU', 'https://www.youtube.com/shorts/SUXM8wN206E', 'https://www.youtube.com/watch?v=PknOS6lbWFw'), isFullyCompleted: false },
      { id: 'm11-s2', title: 'Lily and the Mystery of the Haunted Mansion', videos: videos('https://www.youtube.com/watch?v=VOtNPAXmtEI', 'https://www.youtube.com/shorts/FVEwqeBHHoM', 'https://www.youtube.com/watch?v=xVOtjsqcElg'), isFullyCompleted: false },
      { id: 'm11-s3', title: "Jamie's Race: A Lesson in Friendship", videos: videos('https://www.youtube.com/watch?v=0b1sPJq1BaA'), isFullyCompleted: false },
      { id: 'm11-s4', title: "Elena's Canvas: A Tale of Resilience and Artistry", videos: videos('https://www.youtube.com/watch?v=vGyi6N-Ldzg', 'https://www.youtube.com/watch?v=e9vr1U914K0'), isFullyCompleted: false },
      { id: 'm11-s5', title: "Adrian and Isabella's Love Story", videos: videos('https://www.youtube.com/watch?v=yKYVBIYhwDw', 'https://www.youtube.com/watch?v=R2wYykvmO0Q', 'https://www.youtube.com/watch?v=aNYEtGxjGVc'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm12',
    title: 'Songs Analysis',
    subTopics: [
      { id: 'm12-s1', title: 'See You Again by Wiz Khalifa', videos: videos('https://www.youtube.com/watch?v=Y1NJKpbYLiI', 'https://www.youtube.com/watch?v=NDEWXnMRq3c'), isFullyCompleted: false },
      { id: 'm12-s2', title: 'Let Her Go by Passenger', videos: videos('https://www.youtube.com/watch?v=9WrKw5XtIdk', 'https://www.youtube.com/watch?v=ufsuryIpgEg', 'https://www.youtube.com/watch?v=XMk3BxjD9J0', 'https://www.youtube.com/watch?v=sxcEvFRAsEg'), isFullyCompleted: false },
      { id: 'm12-s3', title: 'Uptown Funk by Mark Ronson ft Bruno Mars', videos: videos('https://www.youtube.com/watch?v=W8FUmkw3a4U'), isFullyCompleted: false },
      { id: 'm12-s4', title: 'Photograph by Ed Sheeran', videos: videos('https://www.youtube.com/watch?v=HpphFd_mzXE'), isFullyCompleted: false },
      { id: 'm12-s5', title: 'Flowers by Miley Cyrus', videos: videos('https://www.youtube.com/watch?v=fQemUin8g-I'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm13',
    title: 'Poetry Analysis',
    subTopics: [
      { id: 'm13-s1', title: 'Remember by Christina Rossetti', videos: videos('https://www.youtube.com/watch?v=qXhFcmV2CUc', 'https://www.youtube.com/watch?v=aTz1EX3WzBo', 'https://www.youtube.com/watch?v=1d1xQCoipRA'), isFullyCompleted: false },
      { id: 'm13-s2', title: 'Design by Robert Frost', videos: videos('https://www.youtube.com/watch?v=94UvNvN6udA', 'https://www.youtube.com/watch?v=dksbDG1bc5U'), isFullyCompleted: false },
    ],
  },
  {
    id: 'm14',
    title: 'Movie Stars Speech Analysis',
    subTopics: [
      { id: 'm14-s1', title: 'Shah Rukh Khan at TED', videos: videos('https://www.youtube.com/watch?v=g0kzHjmvuYQ', 'https://www.youtube.com/watch?v=VY0r0WV0GAQ', 'https://www.youtube.com/watch?v=FsxorSNJBaA', 'https://www.youtube.com/watch?v=962eYqe--Yc', 'https://www.youtube.com/watch?v=Q_m7Z1TWviI', 'https://www.youtube.com/watch?v=i0a61wFaF8A', 'https://www.youtube.com/watch?v=EyCWwmWtdXE', 'https://www.youtube.com/watch?v=wkFkWdGiLrQ', 'https://www.youtube.com/watch?v=aHpdGgmWNhw', 'https://www.youtube.com/watch?v=VKzsH139o_0', 'https://www.youtube.com/watch?v=hVE7v11pd0o'), isFullyCompleted: false },
    ],
  },
]

export default modules
