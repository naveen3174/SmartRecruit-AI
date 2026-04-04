const detectFillerWords = (transcript) => {
  const fillerWords = ['um', 'uh', 'like', 'actually', 'basically', 'you know'];
  const words = transcript.toLowerCase().split(/\s+/);
  
  let count = 0;
  const detected = {};

  fillerWords.forEach(word => {
    const matches = words.filter(w => w === word || w.includes(word)).length;
    if (matches > 0) {
      detected[word] = matches;
      count += matches;
    }
  });

  return {
    totalFillerCount: count,
    details: detected
  };
};

module.exports = { detectFillerWords };
