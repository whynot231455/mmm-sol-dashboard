
$csvPath = 'c:\Users\shibu\OneDrive\Desktop\projects\MMM\src\tests\MMM_Measure_Daily_synthetic_10k.csv'
$data = Import-Csv -Path $csvPath

if ($null -eq $data) {
    Write-Error "Failed to load CSV data."
    exit 1
}

# --- 1. MEASURE PAGE CALCULATIONS ---
$totalRevenue = 0.0
$totalSpend = 0.0
foreach ($row in $data) {
    $totalRevenue += [double]$row.RevenueUSD
    $totalSpend += [double]$row.SpendUSD
}
$totalROAS = if ($totalSpend -gt 0) { $totalRevenue / $totalSpend } else { 0 }

# --- 2. PREDICT PAGE CALCULATIONS (Monthly aggregation) ---
$historyMap = @{}
foreach ($row in $data) {
    $date = [DateTime]::Parse($row.Date)
    $key = "$($date.Year)-$($date.Month.ToString('00'))"
    if (-not $historyMap.ContainsKey($key)) {
        $historyMap[$key] = [PSCustomObject]@{ revenue = 0.0; spend = 0.0 }
    }
    $historyMap[$key].revenue += [double]$row.RevenueUSD
    $historyMap[$key].spend += [double]$row.SpendUSD
}

$sortedKeys = $historyMap.Keys | Sort-Object
$historicalData = $sortedKeys | ForEach-Object { $historyMap[$_] }
$last3Months = $historicalData | Select-Object -Last 3
$avgRevenue = ($last3Months | Measure-Object -Property revenue -Average).Average
$avgSpend = ($last3Months | Measure-Object -Property spend -Average).Average
$baselineROAS = if ($avgSpend -gt 0) { $avgRevenue / $avgSpend } else { 0 }

# Simulation params: spendChange = 0, seasonality = 1 (Normal, mult=1.0)
$projectedSpend = $avgSpend
$projectedRevenue = $projectedSpend * $baselineROAS * 1.0

$totalPredictedRevenue = 0.0
$totalPredictedSpend = 0.0
for ($i = 1; $i -le 3; $i++) {
    $curveFactor = 1 + ($i * 0.05)
    $totalPredictedRevenue += $projectedRevenue * $curveFactor
    $totalPredictedSpend += $projectedSpend
}
$predictedROAS = if ($totalPredictedSpend -gt 0) { $totalPredictedRevenue / $totalPredictedSpend } else { 0 }

# --- 3. OPTIMIZE PAGE CALCULATIONS ---
$totalBudget = 10000000
$scaleFactor = $totalBudget / $totalSpend
# (Simulated reallocation: proportional scaling of all channels)
$optimizedTotalRevenue = $totalRevenue * $scaleFactor
$projectedRevenueLift = (($optimizedTotalRevenue - $totalRevenue) / $totalRevenue) * 100

# --- 4. VALIDATE PAGE CALCULATIONS ---
# Seeded random logic
function Get-SeededRandom($key) {
    [uint32]$h = 2166136261
    foreach ($char in $key.ToCharArray()) {
        $h = [uint32]((($h -bxor [int]$char) * 16777619) -band 0xFFFFFFFF)
    }
    return ($h % 10000) / 10000
}

$ssTotal = 0.0
$ssResidual = 0.0
$mapeSum = 0.0
$allActuals = $historicalData | ForEach-Object { $_.revenue }

for ($idx = 0; $idx -lt $sortedKeys.Count; $idx++) {
    $key = $sortedKeys[$idx]
    $actual = $historicalData[$idx].revenue
    $dateKey = "$($key)-01T00:00:00.000Z" # Exact format for seeded random
    
    $val = Get-SeededRandom "$dateKey"
    $predicted = $actual * (0.95 + $val * 0.1)
    
    $ssResidual += [Math]::Pow($actual - $predicted, 2)
    $mapeSum += [Math]::Abs(($actual - $predicted) / $actual)
}

$meanActual = ($allActuals | Measure-Object -Average).Average
foreach ($actual in $allActuals) {
    $ssTotal += [Math]::Pow($actual - $meanActual, 2)
}

$rSquared = 1 - ($ssResidual / $ssTotal)
$mape = ($mapeSum / $historyMap.Count) * 100

# --- OUTPUT ---
Write-Output "--- MEASURE ---"
Write-Output "Revenue: $totalRevenue"
Write-Output "Spend: $totalSpend"
Write-Output "ROAS: $totalROAS"
Write-Output "`n--- PREDICT ---"
Write-Output "Predicted Revenue (3m): $totalPredictedRevenue"
Write-Output "Predicted ROAS: $predictedROAS"
Write-Output "`n--- OPTIMIZE ---"
Write-Output "Projected Revenue (Scaled to 10M Budget): $optimizedTotalRevenue"
Write-Output "Projected Revenue Lift: $projectedRevenueLift%"
Write-Output "`n--- VALIDATE ---"
Write-Output "R-Squared: $rSquared"
Write-Output "MAPE: $mape%"
