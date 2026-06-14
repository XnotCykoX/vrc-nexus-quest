<script setup>
// Visual OSC scripting — stack blocks, set loops, ramp values (e.g. rainbow Hue), run over OSC.
// No drag-and-drop (awkward on Quest): tap to add, reorder with ↑/↓, edit inline.
import { reactive, ref, computed } from "vue";
import * as osc from "./osc.js";

let uid = 1;
const program = reactive([]);           // array of blocks (top level)
const running = ref(false);
const status = ref("");
const scriptName = ref("My script");
const saved = reactive(loadSaved());

function loadSaved() { try { return JSON.parse(localStorage.getItem("vrc_scripts") || "{}"); } catch { return {}; } }
function persist() { try { localStorage.setItem("vrc_scripts", JSON.stringify(saved)); } catch { /* ignore */ } }
const savedNames = computed(() => Object.keys(saved));

function makeBlock(type) {
  const b = { id: uid++, type };
  if (type === "set") Object.assign(b, { param: "", kind: "num", value: 1 });
  else if (type === "wait") Object.assign(b, { ms: 500 });
  else if (type === "chatbox") Object.assign(b, { text: "" });
  else if (type === "random") Object.assign(b, { param: "", min: 0, max: 1 });
  else if (type === "ramp") Object.assign(b, { param: "", from: 0, to: 1, seconds: 5, pingpong: false });
  else if (type === "input") Object.assign(b, { input: "Jump", pulse: true, value: 1 });
  else if (type === "height") Object.assign(b, { value: 1.7, sweep: false, from: 0.5, to: 2, seconds: 3, pingpong: false });
  else if (type === "hue") Object.assign(b, { value: 0.5, sweep: false, from: 0, to: 1, seconds: 5, pingpong: true });
  else if (type === "emission") Object.assign(b, { value: 1, sweep: false, from: 0, to: 1, seconds: 3, pingpong: false });
  else if (type === "loop") Object.assign(b, { count: 0, children: [] });
  return b;
}
function add(list, type) { list.push(makeBlock(type)); }
function remove(list, i) { list.splice(i, 1); }
function move(list, i, d) { const j = i + d; if (j < 0 || j >= list.length) return; const [x] = list.splice(i, 1); list.splice(j, 0, x); }

const TYPES = [["height", "Height"], ["hue", "Hue"], ["emission", "Emission"], ["set", "Set"], ["ramp", "Ramp"], ["random", "Random"], ["input", "Input"], ["wait", "Wait"], ["chatbox", "Chatbox"], ["loop", "Loop"]];
const HELPER = ["height", "hue", "emission"];
const INPUTS = ["Jump", "Voice", "Run", "MoveForward", "MoveBackward", "MoveLeft", "MoveRight", "ComfortLeft", "ComfortRight"];
const LEAF_TYPES = TYPES.filter((t) => t[0] !== "loop");

// ---- runtime ----
const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, ms)));
function coerceSet(b) { return b.kind === "on" ? true : b.kind === "off" ? false : Number(b.value); }

async function runBlocks(list) {
  for (const b of list) {
    if (!running.value) return;
    try {
      if (b.type === "set") await osc.setParam(b.param.trim(), coerceSet(b));
      else if (b.type === "wait") await sleep(Number(b.ms) || 0);
      else if (b.type === "chatbox") { if (b.text.trim()) await osc.chatbox(b.text.trim()); }
      else if (b.type === "random") { const v = Number(b.min) + Math.random() * (Number(b.max) - Number(b.min)); await osc.setParam(b.param.trim(), Number(v.toFixed(4))); }
      else if (b.type === "input") { if (b.pulse) await osc.pulseInput(b.input.trim()); else await osc.inputInt(b.input.trim(), Number(b.value)); }
      else if (HELPER.includes(b.type)) await runHelper(b);
      else if (b.type === "ramp") await runRamp(b);
      else if (b.type === "loop") {
        let i = 0;
        const count = Number(b.count) || 0; // 0 = forever
        while (running.value && (count === 0 || i < count)) {
          if (!b.children.length) { await sleep(50); }
          else await runBlocks(b.children);
          i++;
        }
      }
    } catch (e) { status.value = "⚠️ " + (e.message || e); }
  }
}
// Smoothly drive apply(value) from->to over `seconds` (~20 updates/sec).
async function sweepVals(apply, from, to, seconds) {
  const steps = Math.max(1, Math.round((Number(seconds) || 1) * 20));
  for (let i = 0; i <= steps; i++) {
    if (!running.value) return;
    await apply(from + (to - from) * (i / steps));
    await sleep(50);
  }
}
// Named helpers (set_height / set_hue / set_emission) — set once, or sweep (optionally bouncing back).
function helperCall(type) { return type === "height" ? osc.setHeight : type === "hue" ? osc.setHue : osc.setEmission; }
async function runHelper(b) {
  const call = helperCall(b.type);
  if (!b.sweep) { await call(Number(b.value)); return; }
  await sweepVals(call, Number(b.from), Number(b.to), b.seconds);
  if (b.pingpong) await sweepVals(call, Number(b.to), Number(b.from), b.seconds);   // …then back down
}
async function runRamp(b) {
  const apply = (v) => osc.setParam(b.param.trim(), Number(Number(v).toFixed(4)));
  await sweepVals(apply, Number(b.from), Number(b.to), b.seconds);
  if (b.pingpong) await sweepVals(apply, Number(b.to), Number(b.from), b.seconds);
}
async function run() {
  if (running.value) return;
  if (!osc.oscAvailable()) { status.value = "OSC runs on the Quest build only."; return; }
  running.value = true; status.value = "▶ Running…";
  await runBlocks(program);
  if (running.value) status.value = "✅ Finished";
  running.value = false;
}
function stop() { running.value = false; status.value = "⏹ Stopped"; }

// ---- save / load ----
function save() {
  const name = scriptName.value.trim(); if (!name) return;
  saved[name] = JSON.parse(JSON.stringify(program));
  persist(); status.value = `💾 Saved "${name}"`;
}
function load(name) {
  const data = saved[name]; if (!data) return;
  program.splice(0, program.length, ...JSON.parse(JSON.stringify(data)).map((b) => ({ ...b, id: uid++ })));
  scriptName.value = name; status.value = `📂 Loaded "${name}"`;
}
function del(name) { delete saved[name]; persist(); }

function loadRainbow() {
  program.splice(0, program.length);
  const loop = makeBlock("loop"); loop.count = 0;
  const hue = makeBlock("hue"); hue.sweep = true; hue.from = 0; hue.to = 1; hue.seconds = 5;
  loop.children.push(hue);
  program.push(loop);
  scriptName.value = "Rainbow";
  status.value = "🌈 Rainbow loaded — bounces ALL hue params 0→1→0, forever. Open the OSC tab once (VRChat OSC on) so it detects them, then Run.";
}
</script>

<template>
  <div>
    <div class="card-lg" style="margin-bottom:16px">
      <div class="row2" style="justify-content:space-between;align-items:center">
        <h2 style="margin:0">🧩 OSC Scripts</h2>
        <div class="row2">
          <button v-if="!running" class="primary" @click="run">▶ Run</button>
          <button v-else class="btn-stop" @click="stop">⏹ Stop</button>
        </div>
      </div>
      <p class="muted small">Build automations from blocks. A <b>Loop</b> (forever) + a <b>Ramp</b> on a colour param = rainbow.</p>
      <div class="row2">
        <input v-model="scriptName" placeholder="Script name" style="max-width:180px" />
        <button class="ghost" @click="save">Save</button>
        <select v-if="savedNames.length" @change="load($event.target.value)">
          <option value="">Load…</option>
          <option v-for="n in savedNames" :key="n" :value="n">{{ n }}</option>
        </select>
        <button class="ghost" @click="loadRainbow">🌈 Rainbow demo</button>
      </div>
      <p v-if="status" class="osc-status">{{ status }}</p>
    </div>

    <div class="palette">
      <button v-for="t in TYPES" :key="t[0]" class="pbtn" @click="add(program, t[0])">+ {{ t[1] }}</button>
    </div>

    <div class="prog">
      <div v-for="(b, i) in program" :key="b.id" class="block" :class="b.type">
        <div class="bhead">
          <span class="btag">{{ b.type }}</span>
          <div class="brow">
            <!-- SET -->
            <template v-if="b.type === 'set'">
              <input v-model="b.param" placeholder="Parameter" class="bin" />
              <select v-model="b.kind" class="bin sm"><option value="num">Number</option><option value="on">On</option><option value="off">Off</option></select>
              <input v-if="b.kind === 'num'" v-model="b.value" class="bin sm" placeholder="value" />
            </template>
            <!-- HEIGHT / HUE / EMISSION (named helpers) -->
            <template v-else-if="HELPER.includes(b.type)">
              <span class="u">{{ b.type === 'height' ? 'metres' : '0–1, all ' + b.type + ' params' }}</span>
              <template v-if="!b.sweep"><input v-model="b.value" class="bin xs" placeholder="value" /></template>
              <template v-else><input v-model="b.from" class="bin xs" placeholder="from" /><input v-model="b.to" class="bin xs" placeholder="to" /><input v-model="b.seconds" class="bin xs" placeholder="sec" /><span class="u">s</span></template>
              <label class="swtog"><input type="checkbox" v-model="b.sweep" /> sweep</label>
              <label v-if="b.sweep" class="swtog"><input type="checkbox" v-model="b.pingpong" /> ↔ bounce</label>
            </template>
            <!-- RAMP -->
            <template v-else-if="b.type === 'ramp'">
              <input v-model="b.param" placeholder="Parameter" class="bin" />
              <input v-model="b.from" class="bin xs" placeholder="from" />
              <input v-model="b.to" class="bin xs" placeholder="to" />
              <input v-model="b.seconds" class="bin xs" placeholder="sec" /><span class="u">s</span>
              <label class="swtog"><input type="checkbox" v-model="b.pingpong" /> ↔ bounce</label>
            </template>
            <!-- RANDOM -->
            <template v-else-if="b.type === 'random'">
              <input v-model="b.param" placeholder="Parameter" class="bin" />
              <input v-model="b.min" class="bin xs" placeholder="min" />
              <input v-model="b.max" class="bin xs" placeholder="max" />
            </template>
            <!-- INPUT -->
            <template v-else-if="b.type === 'input'">
              <select v-model="b.input" class="bin sm"><option v-for="n in INPUTS" :key="n" :value="n">{{ n }}</option></select>
              <select v-model="b.pulse" class="bin sm"><option :value="true">Pulse</option><option :value="false">Hold</option></select>
              <input v-if="!b.pulse" v-model="b.value" class="bin xs" placeholder="0/1" />
            </template>
            <!-- WAIT -->
            <template v-else-if="b.type === 'wait'">
              <input v-model="b.ms" class="bin sm" placeholder="ms" /><span class="u">ms</span>
            </template>
            <!-- CHATBOX -->
            <template v-else-if="b.type === 'chatbox'">
              <input v-model="b.text" placeholder="Message" class="bin" maxlength="144" />
            </template>
            <!-- LOOP -->
            <template v-else-if="b.type === 'loop'">
              <span class="u">repeat</span>
              <input v-model="b.count" class="bin xs" placeholder="0=∞" />
              <span class="u">{{ Number(b.count) ? 'times' : 'forever' }}</span>
            </template>
          </div>
          <div class="bctl">
            <button class="mini" @click="move(program, i, -1)">↑</button>
            <button class="mini" @click="move(program, i, 1)">↓</button>
            <button class="mini" @click="remove(program, i)">✕</button>
          </div>
        </div>
        <!-- loop children -->
        <div v-if="b.type === 'loop'" class="children">
          <div v-for="(c, ci) in b.children" :key="c.id" class="block" :class="c.type">
            <div class="bhead">
              <span class="btag">{{ c.type }}</span>
              <div class="brow">
                <template v-if="c.type === 'set'">
                  <input v-model="c.param" placeholder="Parameter" class="bin" />
                  <select v-model="c.kind" class="bin sm"><option value="num">Number</option><option value="on">On</option><option value="off">Off</option></select>
                  <input v-if="c.kind === 'num'" v-model="c.value" class="bin sm" placeholder="value" />
                </template>
                <template v-else-if="HELPER.includes(c.type)">
                  <span class="u">{{ c.type === 'height' ? 'metres' : '0–1' }}</span>
                  <template v-if="!c.sweep"><input v-model="c.value" class="bin xs" placeholder="value" /></template>
                  <template v-else><input v-model="c.from" class="bin xs" placeholder="from" /><input v-model="c.to" class="bin xs" placeholder="to" /><input v-model="c.seconds" class="bin xs" placeholder="sec" /><span class="u">s</span></template>
                  <label class="swtog"><input type="checkbox" v-model="c.sweep" /> sweep</label>
                  <label v-if="c.sweep" class="swtog"><input type="checkbox" v-model="c.pingpong" /> ↔ bounce</label>
                </template>
                <template v-else-if="c.type === 'ramp'">
                  <input v-model="c.param" placeholder="Parameter" class="bin" />
                  <input v-model="c.from" class="bin xs" placeholder="from" />
                  <input v-model="c.to" class="bin xs" placeholder="to" />
                  <input v-model="c.seconds" class="bin xs" placeholder="sec" /><span class="u">s</span>
                  <label class="swtog"><input type="checkbox" v-model="c.pingpong" /> ↔ bounce</label>
                </template>
                <template v-else-if="c.type === 'random'">
                  <input v-model="c.param" placeholder="Parameter" class="bin" />
                  <input v-model="c.min" class="bin xs" placeholder="min" />
                  <input v-model="c.max" class="bin xs" placeholder="max" />
                </template>
                <template v-else-if="c.type === 'input'">
                  <select v-model="c.input" class="bin sm"><option v-for="n in INPUTS" :key="n" :value="n">{{ n }}</option></select>
                  <select v-model="c.pulse" class="bin sm"><option :value="true">Pulse</option><option :value="false">Hold</option></select>
                  <input v-if="!c.pulse" v-model="c.value" class="bin xs" placeholder="0/1" />
                </template>
                <template v-else-if="c.type === 'wait'">
                  <input v-model="c.ms" class="bin sm" placeholder="ms" /><span class="u">ms</span>
                </template>
                <template v-else-if="c.type === 'chatbox'">
                  <input v-model="c.text" placeholder="Message" class="bin" maxlength="144" />
                </template>
              </div>
              <div class="bctl">
                <button class="mini" @click="move(b.children, ci, -1)">↑</button>
                <button class="mini" @click="move(b.children, ci, 1)">↓</button>
                <button class="mini" @click="remove(b.children, ci)">✕</button>
              </div>
            </div>
          </div>
          <div class="palette inner">
            <button v-for="t in LEAF_TYPES" :key="t[0]" class="pbtn sm" @click="add(b.children, t[0])">+ {{ t[1] }}</button>
          </div>
        </div>
      </div>
      <p v-if="!program.length" class="muted">Tap a block above to start, or try the 🌈 Rainbow demo.</p>
    </div>
  </div>
</template>
