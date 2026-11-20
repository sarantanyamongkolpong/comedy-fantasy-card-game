/**
 * Presents a real engine match in the shape the screens already read
 * (phase, ap, units, zones, log) and keeps that view in sync after each call.
 */

import { installFurniture as installPiece, removeFurniture as removePiece } from '../../src/schema/hideout.js';
import { factionName, FACTION_NAMES } from './sample-catalog.js';

const FACTION_ID = Object.freeze(Object.fromEntries(
  Object.entries(FACTION_NAMES).map(([id, name]) => [name, id]),
));

function factionIdOf(value) {
  if (!value) return null;
  if (FACTION_NAMES[value]) return value;
  return FACTION_ID[value] ?? null;
}

function presentCard(card) {
  return {
    instanceId: card.instanceId,
    cardId: card.cardId,
    name: card.name,
    type: card.type,
    rarity: card.rarity,
    costAp: card.costAp,
    factionRequirement: factionIdOf(card.factionRequirement),
    targetRule: card.targetRule,
    onResolveZone: card.onResolveZone === 'void' ? 'Void' : 'Discard',
    blurb: card.versionAndStatus ?? '',
    versionAndStatus: card.versionAndStatus ?? '',
    effects: card.effects,
  };
}

function statusLabel(status) {
  if (status.kind === 'regen' && Number.isInteger(status.amount)) return `REGEN +${status.amount}`;
  if (status.kind === 'shield' && Number.isInteger(status.amount)) return `SHIELD ${status.amount}`;
  if (status.kind === 'taunt') return 'TAUNT';
  if (status.kind === 'buff' && Number.isInteger(status.amount)) return `${String(status.stat ?? 'STAT').toUpperCase()} +${status.amount}`;
  if (status.kind === 'next_attack' && Number.isInteger(status.amount)) return `NEXT +${status.amount}`;
  return String(status.kind ?? 'status').toUpperCase();
}

function presentUnit(unit) {
  return {
    instanceId: unit.unitId,
    avatarId: unit.avatarId,
    sideId: unit.sideId,
    name: unit.name,
    factionId: unit.factionId,
    role: unit.role,
    hp: unit.hp,
    maxHp: unit.maxHp,
    ko: !unit.alive,
    statuses: (unit.statuses ?? []).map((status) => ({
      id: status.kind === 'buff' ? `${status.stat}Buff` : status.kind,
      name: status.kind,
      amount: Number.isInteger(status.amount) ? status.amount : null,
      label: statusLabel(status),
    })),
  };
}

function logText(entry) {
  if (entry.type === 'play') return `${entry.sideId} played ${entry.cardId} for ${entry.cost} AP (${entry.ap} left).`;
  if (entry.type === 'turn_start') return `${entry.sideId} starts turn ${entry.turnIndex} with ${entry.ap} AP.`;
  if (entry.type === 'turn_end') return `${entry.sideId} ends the turn.`;
  if (entry.type === 'outcome') return `${entry.winnerSideId} wins (${entry.reason}). HP and damage are still provisional.`;
  if (entry.type === 'voluntary_discard') return `${entry.sideId} tossed a card for ${entry.apSpent} AP.`;
  if (entry.type === 'mandatory_discard') return `${entry.sideId} discarded ${entry.instanceIds.length} for free.`;
  if (entry.type === 'opening_hand') return `${entry.sideId} draws an opening hand of ${entry.instanceIds.length}.`;
  if (entry.type === 'battle_start') return `SPD start is provisional. ${entry.startingSideId} goes first.`;
  return entry.type.replaceAll('_', ' ');
}

export function refreshMatchView(view) {
  const state = view.engine;
  view.activeSideId = state.activeSideId;
  view.turnIndex = state.turnIndex ?? 1;
  if (state.outcome?.status === 'decided' || state.phase === 'decided') view.phase = 'decided';
  else if (state.phase === 'end_of_round_discard') view.phase = 'mandatoryDiscard';
  else view.phase = state.activeSideId === 'player' ? 'playerTurn' : 'enemyTurn';
  view.ap = {
    player: state.sides.player?.ap ?? 0,
    enemy: state.sides.enemy?.ap ?? 0,
  };
  view.units = state.sideOrder.flatMap((sideId) => state.sides[sideId].avatars.map(presentUnit));
  view.zones = {
    player: presentZones(state.sides.player.zones),
    enemy: presentZones(state.sides.enemy.zones),
  };
  const cap = state.config.handSize.value;
  view.pendingDiscard = Math.max(0, state.sides.player.zones.hand.length - cap);
  view.log = state.log.slice(-8).map((entry) => ({ ...entry, text: logText(entry) }));
  return view;
}

function presentZones(zones) {
  return {
    draw: zones.draw.map(presentCard),
    hand: zones.hand.map(presentCard),
    discard: zones.discard.map(presentCard),
    void: zones.void.map(presentCard),
  };
}

export function presentMatch(engineState, meta = {}) {
  const view = {
    source: 'engine',
    engine: engineState,
    state: engineState,
    sides: engineState.sides,
    mode: meta.mode ?? 'tower',
    rewardId: meta.rewardId ?? engineState.matchId,
    lastError: '',
  };
  return refreshMatchView(view);
}

/** Acceptance helpers keep the raw match. The screen keeps the view. Both are accepted. */
export function engineStateOf(input) {
  if (input?.engine?.sides) return input.engine;
  if (input?.state?.sides && input.state !== input) return input.state;
  if (input?.sides) return input;
  return input?.engine ?? input?.state ?? input;
}

function viewOf(input) {
  if (input?.engine?.sides && Array.isArray(input.units)) return input;
  const state = engineStateOf(input);
  return presentMatch(state, { mode: input?.mode ?? 'tower', rewardId: input?.rewardId ?? state?.matchId });
}

function avatarIdOf(view, token) {
  if (!token) return token;
  const unit = view.units.find((row) => row.instanceId === token || row.avatarId === token);
  return unit ? unit.avatarId : token;
}

function readLog(result) {
  if (Array.isArray(result?.log)) return result.log;
  if (Array.isArray(result?.actions)) return result.actions;
  return [];
}

function applyTurn(view, result) {
  if (result?.state && result.state !== view.engine) view.engine = result.state;
  refreshMatchView(view);
  view.lastError = result?.ok === false ? String(result.reason ?? 'The engine refused that.') : '';
  return {
    ok: result?.ok !== false,
    reason: result?.reason ?? '',
    log: readLog(result),
    state: view.engine,
    stopped: result?.stopped === true,
    ended: result?.ended === true,
  };
}

export function bindEngine(engine, gacha, save, hooks = {}) {
  const enemyTurn = hooks.playEnemyTurn ?? engine.playEnemyTurn ?? hooks.runEnemyTurn;
  const autoTurn = hooks.runAutoTurn ?? engine.runAutoTurn ?? null;
  const chooseTurn = hooks.chooseAutoActions ?? engine.chooseAutoActions ?? null;

  function fail(view, result) {
    view.lastError = result?.ok === false ? String(result.reason ?? 'The engine refused that.') : '';
    refreshMatchView(view);
    return result;
  }

  function createMatch(input) {
    const teams = (input.teams ?? []).map((team) => ({
      sideId: team.sideId,
      control: team.control ?? (team.sideId === 'enemy' ? 'ai' : 'human'),
      avatars: team.avatars ?? team.members,
    }));
    const state = engine.createMatch({
      seed: input.seed,
      matchId: input.matchId,
      shuffleDecks: input.shuffleDecks !== false,
      teams,
      decks: input.decks,
      config: input.config,
    });
    return presentMatch(state, { mode: input.mode, rewardId: input.rewardId });
  }

  function playAction(input, action) {
    const view = viewOf(input);
    const result = engine.playAction(view.engine, {
      cardInstanceId: action.cardInstanceId,
      actorAvatarId: avatarIdOf(view, action.actorAvatarId),
      targets: (action.targets ?? []).map((token) => avatarIdOf(view, token)),
    });
    return fail(view, result);
  }

  function playBlockReason(view, card) {
    if (!view || view.phase !== 'playerTurn') return 'Wait for your turn.';
    if ((view.ap.player ?? 0) < card.costAp) return `Needs ${card.costAp} AP.`;
    const allies = view.units.filter((unit) => unit.sideId === 'player' && !unit.ko);
    if (allies.length === 0) return 'No avatar left to perform it.';
    if (card.factionRequirement && !allies.some((unit) => unit.factionId === card.factionRequirement)) {
      return `FAC: no living ${factionName(card.factionRequirement)} avatar.`;
    }
    return null;
  }

  function createBannerState(banner, saved = {}) {
    const real = gacha.createBannerState(banner, {
      epicCounter: saved.epicCounter ?? saved.pityEpic ?? 0,
      topCounter: banner.pool === 'companion' ? null : (saved.topCounter ?? saved.pityTop ?? 0),
      pulls: saved.pulls ?? 0,
    });
    return toUiBanner(real);
  }

  function hashSeed(value) {
    if (Number.isInteger(value) && value >= 0) return value;
    return gacha.integerSeed(String(value ?? 1));
  }

  function pull(bannerState, options = {}) {
    const realState = bannerState.real ?? bannerState;
    const result = gacha.pull(realState, {
      seed: hashSeed(options.seed),
      count: options.count ?? 1,
    });
    const results = result.pulls.map((row) => ({
      rarity: row.rarity,
      name: `${row.rarity} TEST token ${row.id}`,
      note: row.forced ? 'Pity hit. TEST weights, not a drop rate. GA-11 is still pending.' : 'TEST weight, not a drop rate.',
      forced: row.forced,
      pool: realState.pool,
      assetId: null,
    }));
    return {
      state: toUiBanner(result.state),
      pulls: result.pulls,
      results,
      chargedG: 0,
    };
  }

  function serialize(bundle) {
    const ui = bundle?.profile ?? bundle;
    const match = bundle?.match ?? null;
    const saved = save.createProfile({
      profileId: 'PLAYER',
      preferences: { autoBattle: ui.autoPlay?.enabled === true },
      currency: { G: Number.isInteger(ui.currencyG) ? ui.currencyG : 0 },
      house: {
        acquiredTiers: Array.isArray(ui.house?.acquiredTiers) && ui.house.acquiredTiers.length > 0
          ? ui.house.acquiredTiers
          : [ui.house?.tierId ?? 'cabin'],
        displayTier: ui.house?.displayTier ?? ui.house?.tierId ?? 'cabin',
        installedFurniture: Array.isArray(ui.house?.installedFurniture) ? ui.house.installedFurniture : [],
      },
      rewardLedger: Object.fromEntries((ui.claimedRewardIds ?? []).map((id) => [id, { grants: { G: 0, items: [] } }])),
      decks: [{
        deckId: 'DECK_ACTIVE',
        cardIds: (ui.deck ?? []).map((instanceId) => ui.actions?.find((row) => row.instanceId === instanceId)?.cardId).filter(Boolean),
      }],
      inventory: {
        avatars: (ui.avatars ?? []).map((row) => stack('avatar', row.avatarId, row)),
        actions: (ui.actions ?? []).map((row) => stack('action', row.cardId, row)),
        companions: [],
      },
      // v0.6 sport hook: mirror the sport save-v3 payload (roster, pity, ledger) at profile.sport.
      ...(ui.sport && typeof ui.sport === 'object' && !Array.isArray(ui.sport) ? { sport: ui.sport } : {}),
    });
    const plainUi = { ...ui };
    delete plainUi._restoredMatch;
    saved.team = Array.isArray(ui.team) ? structuredClone(ui.team) : [];
    saved.deck = Array.isArray(ui.deck) ? structuredClone(ui.deck) : [];
    saved.web = {
      ui: plainUi,
      match: match?.engine ? engine.getState(match.engine) : null,
      mode: match?.mode ?? null,
      rewardId: match?.rewardId ?? null,
      screen: bundle?.screen ?? null,
      battleUi: bundle?.battleUi ?? null,
    };
    return save.serialize(saved);
  }

  function deserialize(json) {
    const saved = save.deserialize(json);
    const web = saved.web;
    if (!web?.ui) throw new Error('This save has no web profile.');
    // v0.6 sport hook: older web saves carry no ui.sport; adopt the migrated profile.sport when it has data.
    if (!web.ui.sport && saved.sport && Object.keys(saved.sport.roster ?? {}).length > 0) web.ui.sport = saved.sport;
    web.ui.autoPlay = {
      ...(web.ui.autoPlay ?? {}),
      enabled: saved.preferences?.autoBattle === true,
      speed: web.ui.autoPlay?.speed ?? 'normal',
    };
    if (saved.house) {
      web.ui.house = {
        ...(web.ui.house ?? {}),
        acquiredTiers: saved.house.acquiredTiers ?? web.ui.house?.acquiredTiers,
        displayTier: saved.house.displayTier ?? web.ui.house?.displayTier ?? web.ui.house?.tierId,
        installedFurniture: Array.isArray(saved.house.installedFurniture)
          ? structuredClone(saved.house.installedFurniture)
          : (web.ui.house?.installedFurniture ?? []),
      };
    }
    const match = web.match ? presentMatch(web.match, { mode: web.mode ?? 'tower', rewardId: web.rewardId ?? web.match.matchId }) : null;
    return {
      ...save.playerView(saved),
      webBundle: true,
      profile: web.ui,
      match,
      screen: web.screen ?? null,
      battleUi: web.battleUi ?? null,
    };
  }

  function dataHouse(profile) {
    const house = profile?.house ?? {};
    const tierId = house.displayTier ?? house.tierId ?? 'cabin';
    return {
      acquiredTiers: Array.isArray(house.acquiredTiers) && house.acquiredTiers.length > 0 ? [...house.acquiredTiers] : [tierId],
      displayTier: tierId,
      installedFurniture: Array.isArray(house.installedFurniture) ? house.installedFurniture.map((piece) => ({ ...piece })) : [],
    };
  }

  function writeHouse(profile, next) {
    const current = profile.house ?? {};
    profile.house = {
      ...current,
      tierId: current.tierId ?? next.displayTier ?? 'cabin',
      acquiredTiers: next.acquiredTiers,
      displayTier: next.displayTier,
      installedFurniture: next.installedFurniture,
    };
  }

  function stashReport(profile) {
    return save.stashReport({
      house: dataHouse(profile),
      inventory: { avatars: [], actions: [], companions: [] },
    });
  }

  function installFurniture(profile, piece) {
    writeHouse(profile, installPiece(dataHouse(profile), piece));
    return stashReport(profile);
  }

  function removeFurniture(profile, furnitureId) {
    writeHouse(profile, removePiece(dataHouse(profile), furnitureId));
    return stashReport(profile);
  }

  return {
    createMatch,
    startTurn(input) {
      const view = viewOf(input);
      return fail(view, engine.startTurn(view.engine));
    },
    playAction,
    discardVoluntary(input, cardInstanceId) {
      const view = viewOf(input);
      return fail(view, engine.discardVoluntary(view.engine, cardInstanceId));
    },
    endTurn(input) {
      const view = viewOf(input);
      return fail(view, engine.endTurn(view.engine));
    },
    resolveEndOfRoundDiscard(input, ids) {
      const view = viewOf(input);
      return fail(view, engine.resolveEndOfRoundDiscard(view.engine, ids));
    },
    getZones(input, sideId) {
      const view = viewOf(input);
      refreshMatchView(view);
      return view.zones[sideId];
    },
    getOutcome(input) { return engine.getOutcome(engineStateOf(input)); },
    playEnemyTurn(input, opts) {
      const view = viewOf(input);
      if (typeof enemyTurn !== 'function') {
        view.lastError = 'src/engine/index.js#playEnemyTurn is missing';
        return { ok: false, reason: 'NO_ENEMY_TURN', log: [] };
      }
      const result = enemyTurn(view.engine, opts);
      return applyTurn(view, result);
    },
    autoAvailable: typeof autoTurn === 'function',
    chooseAutoActions: typeof chooseTurn === 'function'
      ? (state, sideId, opts) => chooseTurn(state, sideId, opts)
      : null,
    refreshMatch: refreshMatchView,
    runAutoTurn(input, sideId = 'player', opts) {
      const view = viewOf(input);
      if (typeof autoTurn !== 'function') return { ok: false, reason: 'AUTO_LOADING', log: [] };
      const result = autoTurn(view.engine, sideId, opts);
      return applyTurn(view, result);
    },
    playBlockReason,
    defaultRuleConfig: engine.defaultRuleConfig,
    createBannerState,
    pull,
    serialize,
    deserialize,
    stashReport,
    installFurniture,
    removeFurniture,
  };
}

function stack(kind, catalogId, row) {
  return {
    instanceId: row.instanceId,
    catalogId,
    kind,
    quantity: 1,
    locked: Boolean(row.locked),
    favorite: Boolean(row.favorite),
    reservations: [],
    source: row.source ?? null,
  };
}

function toUiBanner(real) {
  const epicMax = real.pool === 'companion' ? 100 : 100;
  const topMax = real.pool === 'companion' ? null : 200;
  return {
    bannerId: real.bannerId,
    pool: real.pool,
    pulls: real.pulls,
    pityEpic: real.epicCounter,
    pityEpicMax: epicMax,
    pityTop: real.topCounter,
    pityTopMax: topMax,
    epicCounter: real.epicCounter,
    topCounter: real.topCounter,
    weights: real.banner?.entries ?? [],
    real,
  };
}
