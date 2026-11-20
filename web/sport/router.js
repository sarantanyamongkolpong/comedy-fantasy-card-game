import { navButton } from './shell.js';
import { renderGacha } from './screens/gacha.js';
import { renderHub } from './screens/hub.js';
import { renderPrep } from './screens/prep.js';
import { renderResult } from './screens/result.js';
import { renderRoster } from './screens/roster.js';
import { renderSim } from './screens/sim.js';
import {
  cardById,
  doPull,
  ensureSession,
  entries,
  fieldPlayers,
  finishReward,
  lineupOf,
  runSim,
  updateLineup,
} from './session.js';
import {
  BASKET_COMPAT,
  BASKET_ROLES,
  FOOT_COMPAT,
  assignByRole,
  cycleEntry as nextEntry,
  cycleId,
  flatRoles,
} from './lineup.js';

let ctx = null;
let timer = 0;

function stopTimer() {
  if (timer) clearInterval(timer);
  timer = 0;
  if (ctx) ctx.playing = false;
}

export function stopSport() {
  stopTimer();
  ctx = null;
}

function render() {
  const stage = document.getElementById('stage');
  if (!stage || !ctx) return;
  const view = ctx.screen === 'prep' ? renderPrep(ctx)
    : ctx.screen === 'sim' ? renderSim(ctx)
      : ctx.screen === 'result' ? renderResult(ctx)
        : ctx.screen === 'gacha' ? renderGacha(ctx)
          : ctx.screen === 'roster' ? renderRoster(ctx)
            : renderHub(ctx);
  stage.replaceChildren(view);
}

function lineupReady(sport) {
  const lineup = lineupOf(sport);
  const ids = lineup?.slots ?? [];
  if (ids.length === 0 || ids.some((id) => !id)) return false;
  if (new Set(ids).size !== ids.length) return false;
  if (sport === 'football') {
    const keepers = ids.filter((id) => cardById(id)?.role === 'GK').length;
    return ids.length === 11 && keepers === 1 && Boolean(lineup.coachId);
  }
  if (sport === 'basket') return ids.length === 5 && Boolean(lineup.coachId);
  return ids.length === 2;
}

export function startSport({ profile, onExit }) {
  ensureSession(profile);
  ctx = {
    screen: 'hub',
    sport: null,
    notice: '',
    speed: 1,
    playing: false,
    eventIndex: 0,
    simulation: null,
    granted: null,
    bannerId: 'SPORT_FOOTBALL',
    reveals: [],
    rosterSport: 'football',
    rosterPage: 0,
    nav: (label, onClick, options) => navButton(label, onClick, options),
    exitMap: () => onExit(),
    goHub() {
      stopTimer();
      ctx.screen = 'hub';
      ctx.notice = '';
      render();
    },
    goPrep(sport) {
      stopTimer();
      ctx.sport = sport;
      ctx.screen = 'prep';
      ctx.notice = '';
      render();
    },
    goGacha() {
      stopTimer();
      ctx.screen = 'gacha';
      ctx.notice = '';
      render();
    },
    goRoster() {
      stopTimer();
      ctx.rosterSport = ctx.sport || ctx.rosterSport || 'football';
      ctx.screen = 'roster';
      ctx.notice = '';
      render();
    },
    setRosterSport(sport) {
      ctx.rosterSport = sport;
      ctx.rosterPage = 0;
      render();
    },
    setRosterPage(page) {
      ctx.rosterPage = page;
      render();
    },
    lineupReady,
    setFormation(formation) {
      updateLineup('football', (current) => {
        const assigned = assignByRole(flatRoles(formation), fieldPlayers('football'), FOOT_COMPAT, current.slots);
        return { ...current, formation, slots: assigned.map((card) => card?.id ?? null) };
      });
      render();
    },
    setCoach(sport, coachId) {
      updateLineup(sport, (current) => ({ ...current, coachId }));
      render();
    },
    setScheme(scheme) {
      updateLineup('basket', (current) => ({ ...current, scheme }));
      render();
    },
    setPace(pace) {
      updateLineup('basket', (current) => ({ ...current, pace }));
      render();
    },
    setTyre(sport, tyre) {
      updateLineup(sport, (current) => ({ ...current, tyre }));
      render();
    },
    setSetup(sport, setup) {
      updateLineup(sport, (current) => ({ ...current, setup }));
      render();
    },
    cycleSlot(sport, index) {
      updateLineup(sport, (current) => {
        const slots = current.slots.slice();
        const roles = sport === 'football' ? flatRoles(current.formation) : BASKET_ROLES;
        const compat = sport === 'football' ? FOOT_COMPAT : BASKET_COMPAT;
        slots[index] = cycleId(slots, index, roles[index], fieldPlayers(sport), compat);
        return { ...current, slots };
      });
      render();
    },
    cycleEntry(sport, index) {
      updateLineup(sport, (current) => {
        const slots = current.slots.slice();
        slots[index] = nextEntry(slots, index, entries(sport));
        return { ...current, slots };
      });
      render();
    },
    startSim(sport) {
      if (!lineupReady(sport)) return;
      stopTimer();
      ctx.sport = sport;
      ctx.simulation = runSim(sport);
      ctx.eventIndex = 0;
      ctx.playing = false;
      ctx.speed = 1;
      ctx.granted = null;
      ctx.screen = 'sim';
      ctx.notice = '';
      render();
    },
    togglePlay() {
      const events = ctx.simulation?.events ?? [];
      if (ctx.playing) {
        stopTimer();
        render();
        return;
      }
      if (events.length === 0) return;
      if (ctx.eventIndex >= events.length - 1) ctx.eventIndex = 0;
      ctx.playing = true;
      render();
      startTimer();
    },
    setSpeed(speed) {
      ctx.speed = speed;
      if (ctx.playing) startTimer();
      render();
    },
    skipToResult() { openResult(); },
    showResult() { openResult(); },
    setBanner(bannerId) {
      ctx.bannerId = bannerId;
      ctx.reveals = [];
      ctx.notice = '';
      render();
    },
    pull(count) {
      const outcome = doPull(ctx.bannerId, count);
      if (!outcome.ok) {
        ctx.notice = 'Not enough G. Nothing was charged. PROPOSED.';
      } else {
        ctx.reveals = outcome.results ?? [];
        ctx.notice = `Pulled ${ctx.reveals.length}. Charged ${outcome.chargedG} G · PROPOSED.`;
      }
      render();
    },
  };
  render();
}

function openResult() {
  stopTimer();
  if (!ctx?.simulation) return;
  ctx.granted = finishReward();
  ctx.screen = 'result';
  render();
}

function startTimer() {
  if (timer) clearInterval(timer);
  const speed = ctx?.speed || 1;
  timer = setInterval(() => {
    if (!ctx || ctx.screen !== 'sim') {
      stopTimer();
      return;
    }
    const events = ctx.simulation?.events ?? [];
    if (ctx.eventIndex >= events.length - 1) {
      stopTimer();
      render();
      return;
    }
    ctx.eventIndex += 1;
    render();
  }, 800 / speed);
}
