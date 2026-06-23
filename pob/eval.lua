-- pob/eval.lua
-- Run with: cd $POB_REPO/src && luajit <abs path>/pob/eval.lua <buildXmlPath>
-- Emits one JSON object of numeric metrics to stdout, or {"error":"..."} on failure.

local function jsonStr(s)
	s = tostring(s)
		:gsub("\\", "\\\\"):gsub('"', '\\"')
		:gsub("\n", "\\n"):gsub("\r", "\\r"):gsub("\t", "\\t")
	return '"' .. s .. '"'
end

local function emitError(msg)
	io.write('{"error":' .. jsonStr(msg) .. '}\n')
	os.exit(1)
end

local buildPath = arg and arg[1]
if not buildPath then emitError("missing build XML path argument") end

-- Mirror .busted lpath so dkjson and pure-lua deps resolve (cwd is $POB_REPO/src).
package.path = "../runtime/lua/?.lua;../runtime/lua/?/init.lua;" .. package.path

local ok, err = pcall(function() dofile("HeadlessWrapper.lua") end)
if not ok then emitError("failed to init PoB headless: " .. tostring(err)) end
if mainObject and mainObject.promptMsg then
	emitError("PoB startup error: " .. tostring(mainObject.promptMsg))
end

local f, ferr = io.open(buildPath, "r")
if not f then emitError("cannot open build file: " .. tostring(ferr)) end
local xml = f:read("*a"); f:close()

local lok, lerr = pcall(function() loadBuildFromXML(xml, "eval") end)
if not lok then emitError("failed to load build: " .. tostring(lerr)) end

local o = build and build.calcsTab and build.calcsTab.mainOutput
if not o then emitError("no calc output produced") end

local keys = {
	"TotalDPS", "CombinedDPS", "FullDPS", "TotalDot",
	"WithPoisonDPS", "WithBleedDPS", "WithIgniteDPS",
	"Life", "LifeUnreserved", "EnergyShield", "Mana", "ManaUnreserved", "Ward",
	"TotalEHP", "Armour", "Evasion", "BlockChance", "SpellSuppressionChance",
	"FireResist", "ColdResist", "LightningResist", "ChaosResist",
	"CritChance", "CritMultiplier", "Speed",
}

local dkjson = require("dkjson")
local out = {}
for _, k in ipairs(keys) do
	local v = o[k]
	if type(v) == "number" then out[k] = v end
end
io.write(dkjson.encode(out, { indent = false }))
io.write("\n")
