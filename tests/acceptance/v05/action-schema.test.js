import { bindApi, loadNamed } from './helpers/load-api.js';
import assert from 'node:assert/strict';

const schema = await loadNamed(
  ['src/schema/validate-v05.js', 'src/schema/action-v05.js', 'src/schema/validate-action-v05.js'],
  ['validateActionCardV05'],
  'stream B',
);

const REQUIRED = ['Action_ID', 'Name', 'Type', 'Rarity', 'Cost_AP', 'Effect_Spec', 'On_Resolve_Zone', 'Can_Play', 'Version_And_Status'];
const OPTIONAL = ['Faction_Requirement', 'Duration_Turns', 'Zone_Recovery', 'Asset_Ref'];

function failed(result) {
  if (result === false) return true;
  if (Array.isArray(result)) return result.length > 0;
  if (result && result.ok === false) return true;
  if (result && Array.isArray(result.errors)) return result.errors.length > 0;
  return false;
}

const base = {
  schemaVersion: 'v05',
  cardId: 'ACT_SAMPLE',
  cardKind: 'action_card',
  actionType: 'ATK',
  name: 'Sample',
  apCost: 1,
  costStatus: 'PLACEHOLDER',
  effectId: null,
  rarity: 'N',
  Action_ID: 'ACT_SAMPLE',
  Name: 'Sample',
  Type: 'ATK',
  Rarity: 'N',
  Faction_Requirement: null,
  Cost_AP: 1,
  Target_Rule: null,
  Effect_Spec: { ops: [] },
  Duration_Turns: null,
  On_Resolve_Zone: 'Discard',
  Zone_Recovery: null,
  Can_Play: { ap: true },
  Asset_Ref: null,
  Version_And_Status: 'PLACEHOLDER',
  fieldStatus: { Cost_AP: 'PLACEHOLDER', Target_Rule: 'PENDING_OWNER' },
};

bindApi(schema, [
  ...REQUIRED.map((field) => ({
    name: `${field} v05 action schema field is required`,
    fn(api) {
      const card = { ...base };
      delete card[field];
      assert.equal(failed(api.validateActionCardV05(card)), true, `${field} is required`);
      assert.equal(failed(api.validateActionCardV05(base)), false);
    },
  })),
  ...OPTIONAL.map((field) => ({
    name: `${field} v05 action schema field stays optional`,
    fn(api) {
      const card = { ...base };
      delete card[field];
      assert.equal(failed(api.validateActionCardV05(card)), false);
    },
  })),
  {
    name: 'Target_Rule v05 action schema field stays PENDING',
    fn(api) {
      const card = { ...base, Target_Rule: null };
      assert.equal(failed(api.validateActionCardV05(card)), false);
      const illegal = { ...base, Target_Rule: 'NotATarget' };
      assert.equal(failed(api.validateActionCardV05(illegal)), true);
      assert.equal(card.fieldStatus.Target_Rule === 'PENDING' || card.fieldStatus.Target_Rule === 'PENDING_OWNER', true);
    },
  },
]);
