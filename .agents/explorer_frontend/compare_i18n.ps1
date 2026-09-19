$csharp = @"
using System;
using System.IO;
using System.Text;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System.Web.Script.Serialization;

public class I18nAuditor {
    public static void Run(string trPath, string enPath, string srcDir, string outReportPath) {
        var js = new JavaScriptSerializer();
        js.MaxJsonLength = int.MaxValue;

        string trRaw = File.ReadAllText(trPath, Encoding.UTF8);
        string enRaw = File.ReadAllText(enPath, Encoding.UTF8);

        var trDict = (Dictionary<string, object>)js.DeserializeObject(trRaw);
        var enDict = (Dictionary<string, object>)js.DeserializeObject(enRaw);

        var trFlat = new Dictionary<string, string>();
        var enFlat = new Dictionary<string, string>();

        Flatten("", trDict, trFlat);
        Flatten("", enDict, enFlat);

        var missingInEn = new List<Dictionary<string, string>>();
        var missingInTr = new List<Dictionary<string, string>>();
        var emptyInTr = new List<string>();
        var emptyInEn = new List<string>();
        var placeholderMismatch = new List<Dictionary<string, string>>();
        var identicalLong = new List<Dictionary<string, string>>();

        var rx = new Regex(@"(\{\{[^}]+\}\}|\{[^}]+\}|%[sd])");

        foreach (var kvp in trFlat) {
            if (!enFlat.ContainsKey(kvp.Key)) {
                var d = new Dictionary<string, string>();
                d["key"] = kvp.Key;
                d["trValue"] = kvp.Value;
                missingInEn.Add(d);
            } else {
                string trVal = kvp.Value ?? "";
                string enVal = enFlat[kvp.Key] ?? "";

                if (string.IsNullOrWhiteSpace(trVal)) emptyInTr.Add(kvp.Key);
                if (string.IsNullOrWhiteSpace(enVal)) emptyInEn.Add(kvp.Key);

                var trMatches = new List<string>();
                foreach (Match m in rx.Matches(trVal)) trMatches.Add(m.Value);
                trMatches.Sort();

                var enMatches = new List<string>();
                foreach (Match m in rx.Matches(enVal)) enMatches.Add(m.Value);
                enMatches.Sort();

                string trP = string.Join(",", trMatches.ToArray());
                string enP = string.Join(",", enMatches.ToArray());

                if (trP != enP) {
                    var d = new Dictionary<string, string>();
                    d["key"] = kvp.Key;
                    d["trPlaceholders"] = trP;
                    d["enPlaceholders"] = enP;
                    d["trValue"] = trVal;
                    d["enValue"] = enVal;
                    placeholderMismatch.Add(d);
                }

                if (trVal == enVal && trVal.Length > 15) {
                    var d = new Dictionary<string, string>();
                    d["key"] = kvp.Key;
                    d["value"] = trVal;
                    identicalLong.Add(d);
                }
            }
        }

        foreach (var kvp in enFlat) {
            if (!trFlat.ContainsKey(kvp.Key)) {
                var d = new Dictionary<string, string>();
                d["key"] = kvp.Key;
                d["enValue"] = kvp.Value;
                missingInTr.Add(d);
            }
        }

        // Now scan all components in srcDir
        var usedKeys = new HashSet<string>();
        var missingInDict = new List<Dictionary<string, string>>();
        var tRegex = new Regex(@"\bt\(\s*['""]([a-zA-Z0-9_.]+)['""]");

        var allFiles = Directory.GetFiles(srcDir, "*.tsx", SearchOption.AllDirectories);
        var tsFiles = Directory.GetFiles(srcDir, "*.ts", SearchOption.AllDirectories);
        var codeFiles = new List<string>(allFiles);
        codeFiles.AddRange(tsFiles);

        foreach (var file in codeFiles) {
            if (file.Contains("\\locales\\") || file.Contains("/locales/")) continue;
            string code = File.ReadAllText(file, Encoding.UTF8);
            var matches = tRegex.Matches(code);
            foreach (Match m in matches) {
                string key = m.Groups[1].Value;
                usedKeys.Add(key);
                if (!trFlat.ContainsKey(key)) {
                    var d = new Dictionary<string, string>();
                    d["file"] = file.Substring(srcDir.Length).TrimStart('\\', '/');
                    d["key"] = key;
                    d["call"] = m.Value;
                    missingInDict.Add(d);
                }
            }
        }

        var unusedKeys = new List<string>();
        foreach (var k in trFlat.Keys) {
            if (!usedKeys.Contains(k)) {
                unusedKeys.Add(k);
            }
        }

        var result = new Dictionary<string, object>();
        result["totalTrKeys"] = trFlat.Count;
        result["totalEnKeys"] = enFlat.Count;
        result["missingInEnCount"] = missingInEn.Count;
        result["missingInEn"] = missingInEn;
        result["missingInTrCount"] = missingInTr.Count;
        result["missingInTr"] = missingInTr;
        result["emptyInTrCount"] = emptyInTr.Count;
        result["emptyInTr"] = emptyInTr;
        result["emptyInEnCount"] = emptyInEn.Count;
        result["emptyInEn"] = emptyInEn;
        result["placeholderMismatchCount"] = placeholderMismatch.Count;
        result["placeholderMismatch"] = placeholderMismatch;
        result["identicalLongCount"] = identicalLong.Count;
        result["identicalLong"] = identicalLong;
        result["totalUniqueKeysUsedInCode"] = usedKeys.Count;
        result["missingInDictCount"] = missingInDict.Count;
        result["missingInDict"] = missingInDict;
        result["unusedKeysInDictCount"] = unusedKeys.Count;
        result["unusedKeysInDict"] = unusedKeys;

        string json = js.Serialize(result);
        File.WriteAllText(outReportPath, json, Encoding.UTF8);

        Console.WriteLine("=== AUDIT SUMMARY ===");
        Console.WriteLine("Total TR Keys: " + trFlat.Count);
        Console.WriteLine("Total EN Keys: " + enFlat.Count);
        Console.WriteLine("Missing in EN: " + missingInEn.Count);
        Console.WriteLine("Missing in TR: " + missingInTr.Count);
        Console.WriteLine("Placeholder Mismatches: " + placeholderMismatch.Count);
        Console.WriteLine("Identical Long Strings: " + identicalLong.Count);
        Console.WriteLine("Unique Keys Used in Components: " + usedKeys.Count);
        Console.WriteLine("Keys Used in Components but Missing in Locales: " + missingInDict.Count);
        Console.WriteLine("Keys in Locales never directly matched in t(...): " + unusedKeys.Count);
    }

    private static void Flatten(string prefix, Dictionary<string, object> dict, Dictionary<string, string> flat) {
        foreach (KeyValuePair<string, object> kvp in dict) {
            string fullKey = string.IsNullOrEmpty(prefix) ? kvp.Key : prefix + "." + kvp.Key;
            var subDict = kvp.Value as Dictionary<string, object>;
            var arr = kvp.Value as object[];
            if (subDict != null) {
                Flatten(fullKey, subDict, flat);
            } else if (arr != null) {
                flat[fullKey] = string.Join(", ", Array.ConvertAll(arr, delegate(object o) { return o != null ? o.ToString() : ""; }));
            } else {
                flat[fullKey] = kvp.Value != null ? kvp.Value.ToString() : "";
            }
        }
    }
}
"@

Add-Type -TypeDefinition $csharp -ReferencedAssemblies "System.Web.Extensions"

$trPath = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\src\renderer\src\locales\tr.json"
$enPath = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\src\renderer\src\locales\en.json"
$srcDir = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\src\renderer\src"
$outPath = "c:\Users\BERKE\.gemini\antigravity\scratch\NexusHub\.agents\explorer_frontend\i18n_report.json"

[I18nAuditor]::Run($trPath, $enPath, $srcDir, $outPath)
