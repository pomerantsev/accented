import axe from 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/+esm';

const result = await axe.run();

console.log('Result:', result);
