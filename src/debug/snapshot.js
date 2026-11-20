import { publicView } from '../index.js';
import { dataClone } from './canonical.js';

/**
 * Point-in-time view of a battle state object returned by createBattle.
 * Uses publicView plus the side members already on that object.
 * Does not call unexported engine helpers and does not replace methods.
 * @param {object} state
 */
export function snapshotBattle(state) {
  const view = publicView(state);
  const active = state.activeSideId === state.sideA.sideId ? state.sideA : state.sideB;
  return dataClone({
    battleId: view.battleId,
    startingSideId: view.startingSideId,
    activeSideId: view.activeSideId,
    activeAvatarIds: active.members.map((member) => member.avatarId),
    turnIndex: view.turnIndex,
    roundIndex: view.roundIndex,
    baseAp: state.baseAp,
    ap: view.ap,
    outcome: view.outcome,
    hands: view.hands,
    playedRecords: view.playedRecords,
    engineLog: view.log,
    sides: {
      [state.sideA.sideId]: sideSnapshot(state.sideA),
      [state.sideB.sideId]: sideSnapshot(state.sideB),
    },
  });
}

/**
 * @param {{ sideId: string, members: object[] }} side
 */
function sideSnapshot(side) {
  return {
    sideId: side.sideId,
    avatarIds: side.members.map((member) => member.avatarId),
    members: side.members.map((member) => dataClone(member)),
  };
}
