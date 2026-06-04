import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

const adminPassword = await bcrypt.hash('Admin@123', 10);
const treasurerPassword = await bcrypt.hash('Treasurer@123', 10);
const memberPassword = await bcrypt.hash('Member@123', 10);

try {
  console.log('Seeding database...');

  // Create Admin User
  const adminId = uuidv4();
  await query(
    `INSERT INTO users (id, name, email, phone, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [adminId, 'Admin RT04', 'admin@rt04.local', '081234567890', adminPassword, 'admin', true]
  );
  console.log('✓ Admin user created');

  // Create Treasurer User
  const treasurerId = uuidv4();
  await query(
    `INSERT INTO users (id, name, email, phone, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [treasurerId, 'Bendahara RT04', 'treasurer@rt04.local', '081234567891', treasurerPassword, 'treasurer', true]
  );
  console.log('✓ Treasurer user created');

  // Create Sample Members
  const memberIds = [];
  for (let i = 1; i <= 5; i++) {
    const memberId = uuidv4();
    const userId = uuidv4();
    
    await query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, `Anggota ${i}`, `member${i}@rt04.local`, `0812345678${String(i).padStart(2, '0')}`, memberPassword, 'member', true]
    );

    await query(
      `INSERT INTO members (id, user_id, member_number, status, join_date, balance)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [memberId, userId, `MBR-RT04-${String(i).padStart(3, '0')}`, 'active', new Date(), 0]
    );

    memberIds.push(memberId);
  }
  console.log('✓ 5 sample members created');

  // Create Sample Deposits
  for (let i = 0; i < memberIds.length; i++) {
    const amount = (i + 1) * 100000;
    await query(
      `INSERT INTO deposits (member_id, amount, description, recorded_by)
       VALUES ($1, $2, $3, $4)`,
      [memberIds[i], amount, `Setoran bulanan`, treasurerId]
    );

    await query(
      `INSERT INTO transactions (member_id, type, amount, reference_id, description, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [memberIds[i], 'deposit', amount, memberIds[i], 'Setoran tabungan', treasurerId]
    );

    // Update member balance
    await query(
      `UPDATE members SET balance = balance + $1 WHERE id = $2`,
      [amount, memberIds[i]]
    );
  }
  console.log('✓ Sample deposits created');

  // Create Sample Withdrawal
  const withdrawalId = uuidv4();
  await query(
    `INSERT INTO withdrawals (id, member_id, amount, reason, status, approved_by, recorded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [withdrawalId, memberIds[0], 50000, 'Keperluan mendesak', 'approved', adminId, treasurerId]
  );
  console.log('✓ Sample withdrawal created');

  console.log('✅ Database seeding completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
}
