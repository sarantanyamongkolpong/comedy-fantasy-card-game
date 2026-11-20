import { gameError } from './errors.js';
import {
  applyDamage,
  applyHeal,
  effectiveStat,
  formulaDamage,
  isLiving,
  living,
  opponentId,
  permitMatches,
  pullCard,
  pushStatus,
  scheduleExpiry,
} from './model.js';

function unitsFor(state, ctx, target) {
  const side = ctx.side;
  const enemy = state.sides[opponentId(state, side.sideId)];
  if (target === 'self' || target === 'actor') return [ctx.actor];
  if (target === 'all_allies') return living(side.avatars);
  if (target === 'all_enemies') return living(enemy.avatars);
  if (target === 'all_units') return [...living(side.avatars), ...living(enemy.avatars)];
  if (target === 'chosen' || target === 'enemy' || target === 'ally') return ctx.chosen.filter((unit) => isLiving(unit));
  if (target === 'random_ally') return ctx.randomAlly ? [ctx.randomAlly] : [];
  throw gameError('INVALID_EFFECT', `Unsupported effect target ${target}`);
}

function attackBonus(ctx, attacker) {
  if (ctx.bonusRolled) return ctx.bonus;
  ctx.bonusRolled = true;
  ctx.bonus = 0;
  const passive = attacker.passive;
  if (!passive || passive.trigger !== 'on_attack' || !isLiving(attacker)) return 0;
  const chance = passive.chance ?? 1;
  let proc = false;
  if (chance >= 1) proc = true;
  else if (chance > 0) proc = ctx.rng.next() < chance;
  if (!proc) {
    ctx.state.log.push({ type: 'passive_miss', avatarId: attacker.avatarId, name: passive.name, trigger: 'on_attack' });
    return 0;
  }
  for (const effect of passive.effects) {
    if (effect.op === 'bonus_damage') ctx.bonus += effect.amount;
  }
  ctx.state.log.push({
    type: 'passive_proc',
    avatarId: attacker.avatarId,
    name: passive.name,
    trigger: 'on_attack',
    bonus: ctx.bonus,
  });
  return ctx.bonus;
}

function addRegen(state, unit, effect, source) {
  const policy = state.config.regenStack.policy;
  const ticks = effect.ticks;
  if (policy === 'stack_separate') {
    pushStatus(state, unit, {
      kind: 'regen',
      amount: effect.amount,
      ticksRemaining: ticks,
      appliedTurnIndex: state.turnIndex,
      sourceAvatarId: source.avatarId,
      sourceName: source.name,
      expiry: null,
      expireOnTurnIndex: null,
    });
    return;
  }
  if (policy !== 'refresh_ticks_keep_higher_amount') throw gameError('UNKNOWN_REGEN_STACK');
  const existing = unit.statuses.find((status) => status.kind === 'regen');
  if (!existing) {
    pushStatus(state, unit, {
      kind: 'regen',
      amount: effect.amount,
      ticksRemaining: ticks,
      appliedTurnIndex: state.turnIndex,
      sourceAvatarId: source.avatarId,
      sourceName: source.name,
      expiry: null,
      expireOnTurnIndex: null,
    });
    return;
  }
  existing.amount = Math.max(existing.amount, effect.amount);
  existing.ticksRemaining = Math.max(existing.ticksRemaining, ticks);
  existing.appliedTurnIndex = state.turnIndex;
}

function applyOne(state, ctx, effect, source) {
  if (effect.op === 'trigger_active') {
    if (ctx.activeDepth > 0) throw gameError('ACTIVE_RECURSION');
    if (!ctx.actor.active) throw gameError('NO_ACTIVE');
    ctx.activeDepth += 1;
    try {
      for (const activeEffect of ctx.actor.active.effects) applyOne(state, ctx, activeEffect, ctx.actor.active);
    } finally {
      ctx.activeDepth -= 1;
    }
    state.log.push({ type: 'active', avatarId: ctx.actor.avatarId, name: ctx.actor.active.name, cardInstanceId: ctx.card?.instanceId ?? null });
    return;
  }
  if (effect.op === 'draw') {
    const drawn = [];
    for (let count = 0; count < effect.count; count += 1) {
      const card = pullCard(state, ctx.side, ctx.rng);
      if (!card) break;
      ctx.side.zones.hand.push(card);
      drawn.push(card.instanceId);
    }
    state.log.push({ type: 'effect_draw', sideId: ctx.side.sideId, count: drawn.length, instanceIds: drawn, handSize: ctx.side.zones.hand.length });
    return;
  }
  if (effect.op === 'retrieve') {
    const pileName = effect.pile;
    const ids = ctx.retrieveInstanceIds;
    const moved = [];
    for (const instanceId of ids) {
      const pile = ctx.side.zones[pileName];
      const index = pile.findIndex((card) => card.instanceId === instanceId);
      if (index < 0) throw gameError('NOT_IN_PILE');
      const [card] = pile.splice(index, 1);
      if (!permitMatches(card, effect.permit)) throw gameError('RETRIEVE_PERMIT');
      ctx.side.zones[effect.destination].push(card);
      if (effect.destination === 'draw') {
        const retrieved = ctx.side.zones.draw.pop();
        ctx.side.zones.draw.unshift(retrieved);
      }
      moved.push(instanceId);
    }
    state.log.push({ type: 'retrieve', sideId: ctx.side.sideId, pile: pileName, destination: effect.destination, instanceIds: moved });
    return;
  }

  const targetName = effect.target ?? (ctx.activeDepth > 0 ? ctx.actor.active?.target : null) ?? 'chosen';
  const targets = unitsFor(state, ctx, targetName).filter((unit) => isLiving(unit));
  if (effect.op === 'damage') {
    const bonus = attackBonus(ctx, ctx.actor);
    ctx.dealtDamage = true;
    for (const target of targets) {
      let amount;
      let formula = 'flat';
      let placeholder = false;
      if (effect.mode === 'flat') amount = effect.amount + bonus;
      else {
        const rolled = formulaDamage(ctx.actor, target, state.config, bonus);
        amount = rolled.amount;
        formula = rolled.formula;
        placeholder = true;
      }
      const result = applyDamage(target, amount);
      state.log.push({
        type: 'damage',
        attackerId: ctx.actor.avatarId,
        targetId: target.avatarId,
        avatarId: target.avatarId,
        sideId: target.sideId,
        amount,
        absorbed: result.absorbed,
        dealt: result.dealt,
        delta: -result.dealt,
        hp: target.hp,
        defeated: result.defeated,
        formula,
        placeholder,
        formulaStatus: placeholder ? state.config.damage.status : null,
        preset: placeholder ? (state.config.damage.preset ?? null) : null,
        bonus,
      });
      if (result.defeated) {
        state.log.push({ type: 'avatar_defeated', sideId: target.sideId, avatarId: target.avatarId });
      }
    }
    return;
  }
  for (const target of targets) {
    if (effect.op === 'shield') {
      target.shield += effect.amount;
      state.log.push({
        type: 'shield',
        avatarId: target.avatarId,
        sideId: target.sideId,
        amount: effect.amount,
        delta: 0,
        shield: target.shield,
        placeholder: true,
      });
    } else if (effect.op === 'taunt') {
      pushStatus(state, target, {
        kind: 'taunt',
        amount: null,
        stat: null,
        durationTurns: effect.durationTurns,
        expiry: 'start_of_next_own_turn',
        expireOnTurnIndex: scheduleExpiry(state, effect.durationTurns),
        appliedTurnIndex: state.turnIndex,
        ticksRemaining: null,
        sourceAvatarId: ctx.actor.avatarId,
        sourceName: source?.name ?? null,
      });
    } else if (effect.op === 'buff') {
      pushStatus(state, target, {
        kind: 'buff',
        stat: effect.stat,
        amount: effect.amount,
        durationTurns: effect.durationTurns,
        expiry: 'start_of_next_own_turn',
        expireOnTurnIndex: scheduleExpiry(state, effect.durationTurns),
        appliedTurnIndex: state.turnIndex,
        ticksRemaining: null,
        sourceAvatarId: ctx.actor.avatarId,
        sourceName: source?.name ?? null,
      });
    } else if (effect.op === 'regen') {
      addRegen(state, target, effect, { avatarId: ctx.actor.avatarId, name: source?.name ?? ctx.actor.active?.name ?? null });
      state.log.push({
        type: 'regen_applied',
        avatarId: target.avatarId,
        sideId: target.sideId,
        amount: effect.amount,
        ticks: effect.ticks,
        delta: 0,
        source: source?.name ?? null,
      });
    } else if (effect.op === 'next_attack') {
      pushStatus(state, target, {
        kind: 'next_attack',
        stat: 'atk',
        amount: effect.amount,
        durationTurns: null,
        expiry: 'end_of_turn',
        expireOnTurnIndex: null,
        appliedTurnIndex: state.turnIndex,
        ticksRemaining: null,
        sourceAvatarId: ctx.actor.avatarId,
        sourceName: source?.name ?? null,
      });
    } else {
      throw gameError('INVALID_EFFECT', effect.op);
    }
  }
}

/**
 * @param {object} state
 * @param {object} ctx
 * @param {object[]} effects
 * @param {object | null} source
 */
export function resolveEffects(state, ctx, effects, source) {
  for (const effect of effects) applyOne(state, ctx, effect, source);
  if (ctx.dealtDamage) {
    ctx.actor.statuses = ctx.actor.statuses.filter((status) => status.kind !== 'next_attack');
  }
}

export function expireStartStatuses(state, side) {
  for (const unit of side.avatars) {
    const before = unit.statuses.length;
    unit.statuses = unit.statuses.filter((status) => {
      if (status.expiry === 'start_of_next_own_turn' && status.expireOnTurnIndex === state.turnIndex) return false;
      return true;
    });
    if (unit.statuses.length !== before) {
      state.log.push({ type: 'status_expired', avatarId: unit.avatarId, timing: 'start_of_next_own_turn', turnIndex: state.turnIndex });
    }
  }
}

export function expireEndStatuses(state, side) {
  for (const unit of side.avatars) {
    const before = unit.statuses.length;
    unit.statuses = unit.statuses.filter((status) => status.expiry !== 'end_of_turn');
    if (unit.statuses.length !== before) {
      state.log.push({ type: 'status_expired', avatarId: unit.avatarId, timing: 'end_of_turn', turnIndex: state.turnIndex });
    }
  }
}

export function tickRegen(state, side) {
  if (state.config.regenTickTiming.timing !== 'start_of_affected_side_turn') throw gameError('UNKNOWN_REGEN_TIMING');
  for (const unit of side.avatars) {
    if (!isLiving(unit)) {
      unit.statuses = unit.statuses.filter((status) => status.kind !== 'regen');
      continue;
    }
    for (const status of [...unit.statuses]) {
      if (status.kind !== 'regen') continue;
      if (status.appliedTurnIndex >= state.turnIndex) continue;
      const healed = applyHeal(unit, status.amount, state.config);
      status.ticksRemaining -= 1;
      state.log.push({
        type: 'regen_tick',
        avatarId: unit.avatarId,
        sideId: unit.sideId,
        amount: status.amount,
        healed,
        delta: healed,
        hp: unit.hp,
        ticksRemaining: status.ticksRemaining,
        placeholderTiming: true,
      });
      if (status.ticksRemaining <= 0) {
        unit.statuses = unit.statuses.filter((item) => item !== status);
        state.log.push({ type: 'regen_expired', avatarId: unit.avatarId });
      }
    }
  }
}

function chanceProcs(chance, rng) {
  if (chance >= 1) return true;
  if (chance <= 0) return false;
  return rng.next() < chance;
}

export function fireTurnPassives(state, side, rng) {
  const allies = living(side.avatars);
  for (const unit of side.avatars) {
    if (!isLiving(unit) || !unit.passive || unit.passive.trigger !== 'turn_start') continue;
    const passive = unit.passive;
    if (!chanceProcs(passive.chance ?? 1, rng)) {
      state.log.push({ type: 'passive_miss', avatarId: unit.avatarId, name: passive.name, trigger: 'turn_start' });
      continue;
    }
    let randomAlly = null;
    const needsRandom = passive.effects.some((effect) => effect.target === 'random_ally');
    if (needsRandom) {
      const pool = allies.filter((candidate) => (passive.includeSelf ? true : candidate.avatarId !== unit.avatarId));
      if (pool.length === 0) {
        state.log.push({ type: 'passive_no_target', avatarId: unit.avatarId, name: passive.name });
        continue;
      }
      randomAlly = pool[rng.nextInt(pool.length)];
    }
    const ctx = {
      state,
      rng,
      side,
      actor: unit,
      card: null,
      chosen: [],
      randomAlly,
      retrieveInstanceIds: [],
      activeDepth: 0,
      dealtDamage: false,
      bonusRolled: false,
      bonus: 0,
    };
    resolveEffects(state, ctx, passive.effects, passive);
    state.log.push({ type: 'passive_proc', avatarId: unit.avatarId, name: passive.name, trigger: 'turn_start' });
  }
}

export function refillHand(state, side, rng) {
  const cap = state.config.handSize.value;
  const drawn = [];
  while (side.zones.hand.length < cap) {
    const card = pullCard(state, side, rng);
    if (!card) break;
    side.zones.hand.push(card);
    drawn.push(card.instanceId);
  }
  if (drawn.length > 0) {
    state.log.push({ type: 'draw_to_hand', sideId: side.sideId, instanceIds: drawn, handSize: side.zones.hand.length });
  }
  return drawn;
}
