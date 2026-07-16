import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Modal, ImageBackground, Platform,
} from 'react-native';
import Svg, { Line, Circle, Rect } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCareerStore, rpForLevel } from '../store/careerStore';
import { useCharacterStore, DEFAULT_LOOK } from '../store/characterStore';
import { getNPCsByLocation } from '../data/npcs';
import { Colors } from '../theme/colors';
import { GRAFFITI } from '../theme/fonts';
import { NPC } from '../types/game';
import CharacterLayered from '../components/CharacterLayered';
import { FOLHINHA_DATA } from '../components/FolhinhaArt';

const GOLD   = '#FFAA00';
const PURPLE = '#9D00FF';
const BG = Platform.OS === 'web' ? { uri: '/bg-wall.png' } : require('../../public/bg-wall.png');

// ── Map config ────────────────────────────────────────────────────────────────

const MAP_W = 360;
const MAP_H = 620;

const NPC_POS: Record<string, { x: number; y: number }> = {
  'zé-do-beco':  { x: 0.20, y: 0.80 },
  'luana-flow':  { x: 0.72, y: 0.68 },
  'dread-beats': { x: 0.44, y: 0.52 },
  'fantasma':    { x: 0.18, y: 0.32 },
  'dona-cida':   { x: 0.68, y: 0.18 },
};

// Caminho único sequencial: início → beco → pedreira → complexo → sombras → trono
const SEQUENCE = ['__start__', 'zé-do-beco', 'luana-flow', 'dread-beats', 'fantasma', 'dona-cida'];

const START = { x: 0.44, y: 0.94 };

// ── Visual helpers ────────────────────────────────────────────────────────────

const PERSONALITY_COLOR: Record<string, string> = {
  chill:      '#00CED1',
  arrogante:  '#FF2020',
  timido:     '#6A5ACD',
  agitado:    GOLD,
  misterioso: PURPLE,
};

function diffColor(d: 1 | 2 | 3) {
  return d === 1 ? '#39FF14' : d === 2 ? '#FF8800' : '#FF2020';
}

// ── InfoCell ──────────────────────────────────────────────────────────────────

function InfoCell({ icon, label, value, col }: { icon: string; label: string; value: string; col: string }) {
  return (
    <View style={[ic.cell, { borderColor: col + '30' }]}>
      <View style={ic.header}>
        <Text style={ic.icon}>{icon}</Text>
        <Text style={ic.label}>{label.toUpperCase()}</Text>
      </View>
      <Text style={ic.value} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const ic = StyleSheet.create({
  cell: {
    flex: 1, minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderRadius: 8,
    padding: 10, gap: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  icon:   { fontSize: 13 },
  label:  { fontFamily: GRAFFITI, color: '#555', fontSize: 10, letterSpacing: 2, flex: 1 },
  value:  { color: '#DDD', fontSize: 12, lineHeight: 17 },
});

// ── SVG Map Canvas ────────────────────────────────────────────────────────────

function MapCanvas({ npcs, defeatedIds, onPress }: {
  npcs: NPC[];
  defeatedIds: string[];
  onPress: (npc: NPC) => void;
}) {
  function pos(id: string) {
    if (id === '__start__') return { x: START.x * MAP_W, y: START.y * MAP_H };
    const p = NPC_POS[id];
    return p ? { x: p.x * MAP_W, y: p.y * MAP_H } : { x: MAP_W / 2, y: MAP_H / 2 };
  }

  return (
    <View style={{ width: MAP_W, height: MAP_H }}>

      <Svg width={MAP_W} height={MAP_H} style={StyleSheet.absoluteFill}>
        {/* Grid overlay */}
        {Array.from({ length: 22 }).map((_, row) => {
          const y = row * 30;
          const offset = (row % 2) * 45;
          return Array.from({ length: 10 }).map((_, col) => (
            <Rect
              key={`b${row}-${col}`}
              x={col * 90 + offset - 45} y={y}
              width={84} height={26} rx={2}
              fill="none"
              stroke={GOLD}
              strokeWidth={0.4}
              strokeOpacity={0.08}
            />
          ));
        })}

        {/* Spray halos around nodes */}
        {npcs.map(npc => {
          const p   = NPC_POS[npc.id];
          if (!p) return null;
          const cx  = p.x * MAP_W;
          const cy  = p.y * MAP_H;
          const col = PERSONALITY_COLOR[npc.personality] ?? GOLD;
          return [
            <Circle key={`sp1-${npc.id}`} cx={cx - 28} cy={cy - 20} r={5}  fill={col} fillOpacity={0.12} />,
            <Circle key={`sp2-${npc.id}`} cx={cx + 30} cy={cy - 14} r={3}  fill={col} fillOpacity={0.08} />,
            <Circle key={`sp3-${npc.id}`} cx={cx - 20} cy={cy + 28} r={6}  fill={col} fillOpacity={0.10} />,
            <Circle key={`sp4-${npc.id}`} cx={cx + 22} cy={cy + 20} r={2.5} fill={col} fillOpacity={0.14} />,
          ];
        })}

        {/* Linha única sequencial */}
        {SEQUENCE.slice(0, -1).map((a, i) => {
          const b  = SEQUENCE[i + 1];
          const pa = pos(a);
          const pb = pos(b);
          const done = (a === '__start__' || defeatedIds.includes(a)) && defeatedIds.includes(b);
          const next = (a === '__start__' || defeatedIds.includes(a)) && !defeatedIds.includes(b);
          return (
            <React.Fragment key={i}>
              {(done || next) && (
                <Line
                  x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                  stroke={GOLD} strokeWidth={12} strokeOpacity={0.05}
                />
              )}
              <Line
                x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
                stroke={done ? GOLD : next ? '#888' : '#2C2C2C'}
                strokeWidth={done ? 2.5 : next ? 2 : 1.5}
                strokeDasharray={done ? '7,5' : next ? '5,7' : '3,9'}
                strokeOpacity={done ? 0.75 : next ? 0.45 : 0.3}
                strokeLinecap="round"
              />
            </React.Fragment>
          );
        })}

        {/* Node glow halos */}
        {npcs.map(npc => {
          const p = NPC_POS[npc.id];
          if (!p) return null;
          const col = PERSONALITY_COLOR[npc.personality] ?? GOLD;
          const defeated = defeatedIds.includes(npc.id);
          return (
            <Circle
              key={`halo-${npc.id}`}
              cx={p.x * MAP_W} cy={p.y * MAP_H}
              r={34}
              fill={col}
              fillOpacity={defeated ? 0.22 : 0.08}
            />
          );
        })}
      </Svg>

      {/* NPC nodes */}
      {npcs.map(npc => {
        const p = NPC_POS[npc.id];
        if (!p) return null;
        const cx       = p.x * MAP_W;
        const cy       = p.y * MAP_H;
        const col      = PERSONALITY_COLOR[npc.personality] ?? GOLD;
        const defeated = defeatedIds.includes(npc.id);

        return (
          <React.Fragment key={npc.id}>
            {/* Node */}
            <TouchableOpacity
              style={[mk.node, { left: cx - 28, top: cy - 28, borderColor: col + (defeated ? 'FF' : '70') }]}
              onPress={() => onPress(npc)}
              activeOpacity={0.75}
            >
              <View style={[mk.nodeBg, { backgroundColor: col + '18' }]} />
              <Text style={mk.nodeEmoji}>{npc.emoji}</Text>
              {defeated && (
                <View style={mk.winBadge}>
                  <Ionicons name="checkmark" size={9} color="#000" />
                </View>
              )}
              <View style={[mk.diffStrip, { backgroundColor: diffColor(npc.difficulty) }]} />
            </TouchableOpacity>

            {/* Battle name tag */}
            <View
              style={[mk.nameTag, { left: cx - 62, top: cy + 32, borderColor: col + '50' }]}
              pointerEvents="none"
            >
              <Text style={mk.nameTagTxt} numberOfLines={1}>{npc.battleName.toUpperCase()}</Text>
              <Text style={mk.nameTagCity}>São Paulo</Text>
            </View>
          </React.Fragment>
        );
      })}

      {/* Map label */}
      <View style={mk.mapTag} pointerEvents="none">
        <Text style={mk.mapTagLine1}>UNDERGROUND</Text>
        <Text style={mk.mapTagLine2}>SÃO PAULO</Text>
      </View>
    </View>
  );
}

// ── Interact Modal ─────────────────────────────────────────────────────────────

function InteractModal({ npc, visible, onClose }: { npc: NPC | null; visible: boolean; onClose: () => void }) {
  const { friendships, partners, addPartner } = useCareerStore();

  if (!npc) return null;

  const friendship = friendships[npc.id] ?? 0;
  const col        = PERSONALITY_COLOR[npc.personality] ?? GOLD;
  const isPartner  = partners.includes(npc.id);
  const canPartner = friendship >= 80 && !isPartner;

  function battle() {
    const id = npc?.id;
    if (!id) return;
    onClose();
    router.push({ pathname: '/pre-battle', params: { npcId: id } });
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={mod.overlay} activeOpacity={1} onPress={onClose} />
      <View style={mod.sheet}>

        {/* Banner da folhinha */}
        {(() => {
          const fd = FOLHINHA_DATA[npc.id];
          return fd ? (
            <View style={mod.banner}>
              <fd.Art width={420} height={110} />
              <View style={[mod.bannerStripe, { backgroundColor: col }]} />
            </View>
          ) : (
            <View style={[mod.accentBar, { backgroundColor: col }]} />
          );
        })()}
        <View style={mod.handle} />

        {/* Battle name hero */}
        <View style={mod.battleHero}>
          <Text style={mod.battleHeroTxt} numberOfLines={1}>{npc.battleName.toUpperCase()}</Text>
          <View style={[mod.diffChip, { backgroundColor: diffColor(npc.difficulty) + '22', borderColor: diffColor(npc.difficulty) + '80' }]}>
            {Array.from({ length: npc.difficulty }).map((_, i) => (
              <View key={i} style={[mod.diffDot, { backgroundColor: diffColor(npc.difficulty) }]} />
            ))}
          </View>
        </View>

        {/* Info grid */}
        <View style={mod.infoGrid}>
          <InfoCell icon="💰" label="Custo de Inscrição" value={npc.inscricao} col={col} />
          <InfoCell icon="🏆" label="Premiação"          value={npc.premiacao} col={col} />
          <InfoCell icon="📋" label="Formato"            value={npc.formato}   col={col} />
        </View>

        {/* MC's confirmados — full width */}
        <View style={[mod.mcsCard, { borderColor: col + '30' }]}>
          <View style={ic.header}>
            <Text style={ic.icon}>🎤</Text>
            <Text style={ic.label}>MC'S CONFIRMADOS</Text>
          </View>
          <View style={mod.mcsList}>
            {npc.mcsConfirmados.map((name, i) => (
              <View key={i} style={[mod.mcTag, { backgroundColor: col + '18', borderColor: col + '40' }]}>
                <Text style={[mod.mcTagTxt, { color: i === 0 ? col : '#CCC' }]}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={mod.actions}>
          <TouchableOpacity style={[mod.battleBtn, { backgroundColor: col }]} onPress={() => battle()} activeOpacity={0.85}>
            <Text style={mod.battleBtnTxt}>⚔  BATALHAR</Text>
          </TouchableOpacity>
          {canPartner && (
            <TouchableOpacity style={mod.partnerBtn} onPress={() => { addPartner(npc.id); onClose(); }}>
              <Text style={mod.partnerBtnTxt}>CONVIDAR COMO PARCEIRO</Text>
            </TouchableOpacity>
          )}
          {isPartner && (
            <View style={mod.partnerDone}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.neon} />
              <Text style={mod.partnerDoneTxt}>PARCEIRO CONFIRMADO</Text>
            </View>
          )}
        </View>

      </View>
    </Modal>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function WorldScreen() {
  const career    = useCareerStore();
  const character = useCharacterStore(s => s.character);
  const [selectedNPC, setSelectedNPC] = useState<NPC | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const npcs     = getNPCsByLocation(career.currentMapId);
  const rpNeeded = rpForLevel(career.level);
  const rpPct    = Math.min(100, (career.rp / rpNeeded) * 100);

  return (
    <ImageBackground source={BG} style={s.root} resizeMode="cover">
      <View style={s.overlay} />

      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.replace('/menu')} style={s.backBtn}>
          <Ionicons name="arrow-back" size={20} color={GOLD} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>MAPA</Text>
          <Text style={s.headerSub}>UNDERGROUND · SÃO PAULO</Text>
        </View>

        <TouchableOpacity onPress={() => router.push('/career')} style={s.levelBtn}>
          {career.attributePoints > 0 && <View style={s.levelDot} />}
          <Text style={s.levelTxt}>LV {career.level}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Player HUD ── */}
      <View style={s.hud}>
        <View style={s.charThumb}>
          <CharacterLayered look={character?.look ?? DEFAULT_LOOK} size={44} />
        </View>
        <View style={s.hudInfo}>
          <Text style={s.hudName}>{character?.battleName ?? 'MC'}</Text>
          <View style={s.xpRow}>
            <View style={s.xpBg}>
              <View style={[s.xpFill, { width: `${rpPct}%` as any }]} />
            </View>
            <Text style={s.xpTxt}>{career.rp} / {rpNeeded} RP</Text>
          </View>
        </View>
        <View style={s.hudHype}>
          <Text style={s.hypeVal}>{career.hype}</Text>
          <Text style={s.hypeLbl}>🔥 {career.hype === 1 ? 'DIA' : 'DIAS'}</Text>
        </View>
      </View>

      {/* ── Map ── */}
      <ScrollView
        contentContainerStyle={s.mapScroll}
        showsVerticalScrollIndicator={false}
      >
        <MapCanvas
          npcs={npcs}
          defeatedIds={career.defeatedNpcIds}
          onPress={npc => { setSelectedNPC(npc); setModalVisible(true); }}
        />
      </ScrollView>

      <InteractModal
        npc={selectedNPC}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </ImageBackground>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#060606' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.58)' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,170,0,0.15)',
  },
  backBtn: { padding: 6 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle:  { fontFamily: GRAFFITI, color: GOLD, fontSize: 26, letterSpacing: 6 },
  headerSub:    { fontFamily: GRAFFITI, color: '#666', fontSize: 12, letterSpacing: 3, marginTop: -2 },
  levelBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,170,0,0.12)',
    borderWidth: 1, borderColor: GOLD + '60',
    borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6,
    position: 'relative',
  },
  levelDot: {
    position: 'absolute', top: -3, right: -3,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3300',
  },
  levelTxt: { fontFamily: GRAFFITI, color: GOLD, fontSize: 16, letterSpacing: 2 },

  hud: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  charThumb: { width: 44, height: 56, overflow: 'hidden' },
  hudInfo:   { flex: 1, gap: 4 },
  hudName:   { fontFamily: GRAFFITI, color: '#FFF', fontSize: 18, letterSpacing: 2 },
  xpRow:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  xpBg:      { flex: 1, height: 4, backgroundColor: '#1E1E1E', borderRadius: 2 },
  xpFill:    { height: 4, backgroundColor: GOLD, borderRadius: 2 },
  xpTxt:     { fontFamily: GRAFFITI, color: '#555', fontSize: 11 },
  hudHype:   { alignItems: 'center', gap: 1 },
  hypeVal:   { fontFamily: GRAFFITI, color: '#FF6600', fontSize: 24, lineHeight: 24 },
  hypeLbl:   { fontFamily: GRAFFITI, color: '#555', fontSize: 10, letterSpacing: 1 },

  mapScroll: { alignItems: 'center', paddingVertical: 16 },
});

const mk = StyleSheet.create({
  node: {
    position: 'absolute', width: 56, height: 56,
    borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(10,10,10,0.88)',
  },
  nodeBg:   { ...StyleSheet.absoluteFillObject, borderRadius: 6 },
  nodeEmoji: { fontSize: 24 },
  winBadge: {
    position: 'absolute', top: 3, right: 3,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#39FF14',
    alignItems: 'center', justifyContent: 'center',
  },
  diffStrip: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3 },

  nameTag: {
    position: 'absolute', width: 124,
    backgroundColor: 'rgba(8,8,8,0.88)',
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 4,
    alignItems: 'center', gap: 3,
  },
  nameTagTxt:  { fontFamily: GRAFFITI, color: '#EEE', fontSize: 11, letterSpacing: 1 },
  nameTagCity: { color: '#777', fontSize: 9, letterSpacing: 1 },

  mapTag: {
    position: 'absolute', top: 12, right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderLeftWidth: 2, borderLeftColor: GOLD,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  mapTagLine1: { fontFamily: GRAFFITI, color: GOLD, fontSize: 13, letterSpacing: 4 },
  mapTagLine2: { fontFamily: GRAFFITI, color: '#666', fontSize: 11, letterSpacing: 3 },
});

const mod = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 18, borderTopRightRadius: 18,
    borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    paddingBottom: 36,
  },
  banner: { borderTopLeftRadius: 18, borderTopRightRadius: 18, overflow: 'hidden' },
  bannerStripe: { height: 3 },
  accentBar: { height: 4, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  handle: {
    width: 36, height: 3, backgroundColor: '#2A2A2A',
    borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 4,
  },

  // Battle hero
  battleHero: {
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  battleHeroTxt: { fontFamily: GRAFFITI, color: '#FFF', fontSize: 22, letterSpacing: 3, flex: 1 },
  diffChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
  },
  diffDot: { width: 7, height: 7, borderRadius: 4 },

  // MC row
  mcRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10 },
  mcAvatar: {
    width: 52, height: 52, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  mcEmoji: { fontSize: 26 },
  mcInfo:  { flex: 1, gap: 3 },
  mcName:  { fontFamily: GRAFFITI, color: '#EEE', fontSize: 18, letterSpacing: 2 },
  mcNick:  { color: '#666', fontSize: 11, letterSpacing: 1 },
  friendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  statusPill: { borderWidth: 1, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  statusPillTxt: { fontFamily: GRAFFITI, fontSize: 11, letterSpacing: 1 },
  friendBar:  { flex: 1, height: 3, backgroundColor: '#1E1E1E', borderRadius: 2 },
  friendFill: { height: 3, borderRadius: 2 },
  friendNum:  { fontFamily: GRAFFITI, fontSize: 11, width: 20, textAlign: 'right' },
  closeBtn:   { padding: 6 },

  // Info grid
  infoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    paddingHorizontal: 16, paddingBottom: 8,
  },
  mcsCard: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderRadius: 8,
    padding: 10, gap: 8,
  },
  mcsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  mcTag: {
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  mcTagTxt: { fontSize: 12 },

  // Speech
  speech: {
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderLeftWidth: 3, borderRadius: 4, padding: 12,
  },
  speechTxt: { color: '#CCC', fontSize: 13, lineHeight: 20, fontStyle: 'italic' },
  speechBy:  { color: '#555', fontSize: 10, letterSpacing: 2, marginTop: 6 },

  sectionLbl: {
    fontFamily: GRAFFITI, color: '#444', fontSize: 13, letterSpacing: 5,
    paddingHorizontal: 16, marginBottom: 8,
  },

  beatBtn: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 6, borderWidth: 1.5,
    borderColor: '#2A2A2A', paddingHorizontal: 12, paddingVertical: 10,
    alignItems: 'center', gap: 3, minWidth: 76,
  },
  beatEmoji: { fontSize: 20 },
  beatName:  { fontFamily: GRAFFITI, color: '#555', fontSize: 12, letterSpacing: 1 },
  beatPref:  { fontFamily: GRAFFITI, fontSize: 11, letterSpacing: 1 },

  actions:     { paddingHorizontal: 16, gap: 8, marginTop: 10 },
  battleBtn:   { borderRadius: 6, paddingVertical: 15, alignItems: 'center' },
  battleBtnTxt:{ fontFamily: GRAFFITI, color: '#000', fontSize: 22, letterSpacing: 6 },
  partnerBtn:  {
    borderRadius: 6, borderWidth: 1.5, borderColor: Colors.neon,
    paddingVertical: 12, alignItems: 'center',
  },
  partnerBtnTxt:{ fontFamily: GRAFFITI, color: Colors.neon, fontSize: 16, letterSpacing: 3 },
  partnerDone:   { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', padding: 10 },
  partnerDoneTxt:{ fontFamily: GRAFFITI, color: Colors.neon, fontSize: 14, letterSpacing: 3 },
});
