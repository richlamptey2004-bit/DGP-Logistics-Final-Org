import 'dotenv/config';
import { validatePasswordStrength } from '../server/security';
import { getAdminCount, provisionOwnerAccount } from '../server/store';

async function main() {
  const arg1 = process.argv[2];
  const arg2 = process.argv[3];
  const arg3 = process.argv[4];

  // Supports either: <password> OR <email> <password> [full-name]
  const hasExplicitEmail = Boolean(arg2);
  const email = hasExplicitEmail ? arg1 : 'owner@dgplogistics.local';
  const password = hasExplicitEmail ? arg2 : arg1;
  const fullName = arg3 || 'DGP LOGISTICS Owner';

  if (!password) {
    console.error(
      'Usage: npx tsx scripts/provision-owner.ts <strong-password> OR <owner-email> <strong-password> [full-name]',
    );
    process.exit(1);
  }

  const count = await getAdminCount();
  if (count > 0) {
    console.error('An administrator account already exists. Aborting provisioning.');
    process.exit(1);
  }

  const check = validatePasswordStrength(password);
  if (!check.valid) {
    console.error(`Password rejected by security policy: ${check.reason}`);
    process.exit(1);
  }

  const created = await provisionOwnerAccount({ email, fullName, password });
  console.log(`Owner account provisioned successfully for ${created.email} (ID: ${created.id}).`);
}

main().catch((err) => {
  console.error('Provisioning failed:', err.message);
  process.exit(1);
});
