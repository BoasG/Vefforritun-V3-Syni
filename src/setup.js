import { promises } from 'fs';
import faker from 'faker';

import { query, end } from './db.js';

const schemaFile = './sql/schema.sql';

function fakeNationalId() {
  return Math.floor(1000000000 + Math.random() * 9000000000);
}

function createFakeData(n) {
  const nationalIds = new Set();

  const fake = [];

  while (fake.length < n) {
    const nationalId = fakeNationalId();

    if (nationalIds.has(nationalId)) {
      // eslint-disable-next-line no-continue
      continue;
    }
    nationalIds.add(nationalId);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    fake.push({
      name: faker.name.findName(),
      nationalId,
      comment: Math.random() < 0.5 ? '' : faker.lorem.sentence(),
      anonymous: Math.random() < 0.25,
      signed: faker.date.between(twoWeeksAgo, new Date()),
    });
  }

  return fake;
}

async function create() {
  const data = await promises.readFile(schemaFile);

  await query(data.toString('utf-8'));

  const fakes = createFakeData(500);

  for (let i = 0; i < fakes.length; i += 1) {
    const fake = fakes[i];

    try {
      // eslint-disable-next-line no-await-in-loop
      await query(
        `
          INSERT INTO
            signatures (name, nationalId, comment, anonymous, signed)
          VALUES
            ($1, $2, $3, $4, $5)`,
        [fake.name, fake.nationalId, fake.comment, fake.anonymous, fake.signed],
      );
    } catch (e) {
      console.error('Error inserting', e);
      return;
    }
  }

  await end();

  console.info('Schema & fake data created');
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
