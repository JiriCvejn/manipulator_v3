// File: apps/backend/scripts/seed.js
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { sequelize } from '../src/models/Database.js';
import '../src/models/initModels.js';

import User from '../src/models/User.js';
import Storage from '../src/models/Storage.js';
import Route from '../src/models/Route.js';
import PriorityRule from '../src/models/PriorityRule.js';
import Layout from '../src/models/Layout.js';
import LayoutCell from '../src/models/LayoutCell.js';
import Order from '../src/models/Order.js';

async function seed() {
  try {
    // Pro jistotu ověříme připojení
    await sequelize.authenticate();

    // 1) Základní sklady
    const [a01] = await Storage.findOrCreate({ where: { code: 'A01' }, defaults: { name: 'A01 – Výroba' } });
    const [g22] = await Storage.findOrCreate({ where: { code: 'G22' }, defaults: { name: 'G22 – Expedice' } });

    // 2) Trasy
    await Route.findOrCreate({ where: { fromCode: 'A01', toCode: 'G22' }, defaults: { active: true } });
    await Route.findOrCreate({ where: { fromCode: 'G22', toCode: 'A01' }, defaults: { active: true } });

    // 3) Pravidla priorit
    await PriorityRule.findOrCreate({
      where: { scope: 'route', fromCode: 'A01', toCode: 'G22' },
      defaults: { defaultUrgency: 'STANDARD', enabled: true },
    });

    // 4) Admin uživatel
    const adminPass = await bcrypt.hash('admin', 10);
    await User.findOrCreate({
      where: { username: 'admin' },
      defaults: { passwordHash: adminPass, role: 'admin', active: true },
    });

    // 5) Layout 12×12 (ukázka několika buněk)
    const [layout] = await Layout.findOrCreate({
      where: { name: 'Základní layout' },
      defaults: { name: 'Základní layout' },
    });

    const cells = [
      { layoutId: layout.id, row: 1, col: 1, active: true,  storageCode: 'A01', label: 'A' },
      { layoutId: layout.id, row: 1, col: 2, active: true,  storageCode: null,  label: 'A' },
      { layoutId: layout.id, row: 2, col: 2, active: true,  storageCode: 'G22', label: 'G' },
      { layoutId: layout.id, row: 3, col: 5, active: false, storageCode: null,  label: null },
    ];

    for (const c of cells) {
      await LayoutCell.findOrCreate({
        where: { layoutId: c.layoutId, row: c.row, col: c.col },
        defaults: c,
      });
    }

    // 6) Ukázkové objednávky
    await Order.findOrCreate({
      where: { id: 1 },
      defaults: {
        fromCode: 'A01',
        toCode: 'G22',
        urgency: 'STANDARD',
        note: 'Test objednávka',
        status: 'new',
      },
    });

    console.log('Seed OK');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seed();
