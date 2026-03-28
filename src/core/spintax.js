/**
 * Spintax parser - {คำ1|คำ2|คำ3} → random pick
 */

function parseSpintax(text) {
  if (!text) return '';
  return text.replace(/\{([^{}]+)\}/g, (match, group) => {
    const options = group.split('|');
    return options[Math.floor(Math.random() * options.length)];
  });
}

module.exports = { parseSpintax };
