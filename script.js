document.addEventListener('DOMContentLoaded', () => {
    // Inputs (IDs match HTML)
    const modalAwalInput = document.getElementById('modalAwal');
    const cicilanInput = document.getElementById('cicilan');
    const bungaInput = document.getElementById('bunga');
    const periodeInput = document.getElementById('periode');
    const calculateBtn = document.getElementById('calculateBtn');

    // Outputs (IDs match HTML)
    const totalSetorEl = document.getElementById('totalSetor');
    const totalBungaEl = document.getElementById('totalBunga');
    const saldoAkhirEl = document.getElementById('saldoAkhir');
    const resultTableBody = document.querySelector('#resultTable tbody');

    // Chart
    let investmentChart = null;

    calculateBtn.addEventListener('click', () => {
        calculateAndVisualize();
    });

    // Formatting currency
    const formatter = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });

    function calculateAndVisualize() {
        // Get values
        const modalAwal = parseFloat(modalAwalInput.value) || 0;
        const cicilanBulanan = parseFloat(cicilanInput.value) || 0;
        const bungaPersenThn = parseFloat(bungaInput.value) || 0;
        const durasiTahun = parseFloat(periodeInput.value) || 0;

        if (durasiTahun <= 0) {
            alert('Durasi tahun harus lebih dari 0');
            return;
        }

        // Logic Translation
        let saldo = modalAwal;
        let totalUangDisetor = modalAwal;

        // Definisikan r_tahunan_desimal
        const rTahunanDesimal = bungaPersenThn / 100;

        // Konversi bunga tahunan efektif ke bulanan efektif
        // rate_bulanan = (1 + r_tahunan_desimal)**(1/12) - 1
        const rateBulanan = Math.pow(1 + rTahunanDesimal, 1 / 12) - 1;

        const totalBulan = Math.floor(durasiTahun * 12);

        let bungaKumulatifLalu = 0;

        // Data for Chart
        const labels = ['0 Thn'];
        const dataSetor = [modalAwal];
        const dataBunga = [0];
        const dataSaldo = [modalAwal];

        // Clear Table
        resultTableBody.innerHTML = '';

        // Simulating the loop
        for (let bulan = 1; bulan <= totalBulan; bulan++) {
            // 1. Hitung bunga bulan ini
            const bungaBulanIni = saldo * rateBulanan;

            // 2. Update saldo
            saldo += bungaBulanIni;
            saldo += cicilanBulanan;
            totalUangDisetor += cicilanBulanan;

            // --- Laporan Tahunan ---
            if (bulan % 12 === 0) {
                const tahunKe = bulan / 12;

                // Hitung total bunga sampai saat ini
                const totalBungaSekarang = saldo - totalUangDisetor;

                // Hitung bunga yang didapat HANYA di tahun ini
                const bungaTahunIni = totalBungaSekarang - bungaKumulatifLalu;

                // Add to table
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${tahunKe}</td>
                    <td class="currency">${formatter.format(totalUangDisetor)}</td>
                    <td class="currency">${formatter.format(bungaTahunIni)}</td>
                    <td class="currency">${formatter.format(totalBungaSekarang)}</td>
                    <td class="currency" style="font-weight:bold; color:#10b981;">${formatter.format(saldo)}</td>
                `;
                resultTableBody.appendChild(row);

                // Update previous cumulative interest
                bungaKumulatifLalu = totalBungaSekarang;

                // Add to chart
                labels.push(`${tahunKe} Thn`);
                dataSetor.push(totalUangDisetor);
                dataBunga.push(totalBungaSekarang);
                dataSaldo.push(saldo);
            }
        }

        // --- Post Loop Correction (as per Python script) ---
        // "Pengurangan setoran cicilan bulan terakhir dari total_uang_disetor karena sudah ditambahkan di loop terakhir"
        totalUangDisetor -= cicilanBulanan;

        // Final Calculations
        const finalSaldo = saldo;
        const finalTotalBunga = finalSaldo - totalUangDisetor;

        // Update Stats
        totalSetorEl.textContent = formatter.format(totalUangDisetor);
        totalBungaEl.textContent = formatter.format(finalTotalBunga);
        saldoAkhirEl.textContent = formatter.format(finalSaldo);

        // Show Results with Animation
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.classList.remove('hidden');
        resultsContainer.classList.add('visible');

        // Update Chart
        updateChart(labels, dataSetor, dataBunga, dataSaldo);
    }

    function updateChart(labels, dataSetor, dataBunga, dataSaldo) {
        const ctx = document.getElementById('growthChart').getContext('2d');

        if (investmentChart) {
            investmentChart.destroy();
        }

        investmentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Setor',
                        data: dataSetor,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)', // Light Blue fill
                        borderColor: '#3b82f6', // CariKosan Blue
                        borderWidth: 2,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 0
                    },
                    {
                        label: 'Saldo Akhir (Cuan)',
                        data: dataSaldo,
                        backgroundColor: 'rgba(16, 185, 129, 0.1)', // Light green
                        borderColor: '#10b981', // CariKosan Green
                        borderWidth: 3,
                        fill: false,
                        tension: 0.3,
                        pointBackgroundColor: '#fff',
                        pointBorderColor: '#10b981',
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            font: {
                                family: 'Poppins'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: '#fff',
                        titleColor: '#1f2937',
                        bodyColor: '#4b5563',
                        borderColor: '#e5e7eb',
                        borderWidth: 1,
                        padding: 10,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Poppins'
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [5, 5]
                        },
                        ticks: {
                            font: {
                                family: 'Poppins'
                            },
                            callback: function (value) {
                                return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', notation: 'compact' }).format(value);
                            }
                        }
                    }
                }
            }
        });
    }


});
