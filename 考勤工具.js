"ui";

// ============================================================
// 考勤工具 V20.2
// 基于用户 V20.1 版本升级
//
// V20.2 本阶段：
// 1. 新增 / 修改模式视觉区分
// 2. 增加“保存修改 / 取消修改”
// 3. 日期选择增加“自定义日期”
// 4. 月度详细汇总
// 5. 年度总结
// 6. 年度最高 / 最低月份统计
//
// 保留 V20.1：
// 1. 恢复备份前自动保护当前数据
// 2. 备份完整性检查
// 3. 最近730天日期
// 4. 备份文件严格识别 kaoqin_backup_ 前缀
//
// 注意：
// 数据文件仍沿用 V19 文件名，避免升级后丢失原有数据。
// ============================================================


const JSON_FILE = files.join(
    files.cwd(),
    "考勤记录_v19.json"
);

const SETTING_FILE = files.join(
    files.cwd(),
    "kaoqin_setting_v19.json"
);

const BACKUP_FOLDER = files.join(
    files.cwd(),
    "kaoqin_backup_v19"
);


// ============================================================
// 基础设置
// ============================================================

function defaultSetting(){

    return {

        wage:"18",

        wageType:"hour",

        clockIn:"08:00",

        clockOut:"18:00",

        restHour:"1.0"
    };
}


// ============================================================
// 读取设置
// ============================================================

function loadSetting(){

    if(!files.exists(SETTING_FILE)){

        return defaultSetting();
    }

    try{

        let obj =
            JSON.parse(
                files.read(
                    SETTING_FILE
                )
            );

        if(
            !obj ||
            typeof obj!=="object"
        ){

            return defaultSetting();
        }

        return Object.assign(
            defaultSetting(),
            obj
        );

    }catch(e){

        return defaultSetting();
    }
}


// ============================================================
// 保存设置
// ============================================================

function saveSetting(obj){

    try{

        files.write(
            SETTING_FILE,
            JSON.stringify(
                obj,
                null,
                2
            )
        );

        return true;

    }catch(e){

        if(
            typeof ui!=="undefined" &&
            ui.logText
        ){

            ui.logText.text(
                "⚠️设置保存失败："+e.message
            );
        }

        return false;
    }
}


// ============================================================
// 数据读写
// ============================================================

function loadRecords(){

    if(!files.exists(JSON_FILE)){

        return [];
    }

    try{

        let data =
            JSON.parse(
                files.read(
                    JSON_FILE
                )
            );

        return Array.isArray(data)
            ? data
            : [];

    }catch(e){

        if(
            typeof ui!=="undefined" &&
            ui.logText
        ){

            ui.logText.text(
                "读取异常："+e.message
            );
        }

        return [];
    }
}


// ============================================================
// 保存记录
// ============================================================

function saveRecords(arr){

    try{

        files.write(
            JSON_FILE,
            JSON.stringify(
                arr,
                null,
                2
            )
        );

        return true;

    }catch(e){

        if(
            typeof ui!=="undefined" &&
            ui.logText
        ){

            ui.logText.text(
                "⚠️记录保存失败："+e.message
            );
        }

        return false;
    }
}


// ============================================================
// 日期
// ============================================================

function getNowDate(){

    let d =
        new Date();

    let y =
        d.getFullYear();

    let m =
        String(
            d.getMonth()+1
        ).padStart(
            2,
            "0"
        );

    let day =
        String(
            d.getDate()
        ).padStart(
            2,
            "0"
        );

    return `${y}-${m}-${day}`;
}


// ============================================================
// 日期对象转字符串
// ============================================================

function dateToString(y,m,d){

    return `${y}-`+
        `${String(m).padStart(2,"0")}-`+
        `${String(d).padStart(2,"0")}`;
}


// ============================================================
// 格式化月份
// ============================================================

function formatMonth(ym){

    if(!ym){

        return "";
    }

    return ym.replace(
        "-",
        "年"
    )+"月";
}


// ============================================================
// 星期
// ============================================================

function getWeekDay(dateStr){

    try{

        let d =
            new Date(
                dateStr+
                "T00:00:00"
            );

        let week = [
            "日",
            "一",
            "二",
            "三",
            "四",
            "五",
            "六"
        ];

        return "周"+
            week[d.getDay()];

    }catch(e){

        return "";
    }
}


// ============================================================
// 日期格式检查
// ============================================================

function isValidDateString(str){

    if(
        typeof str!=="string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(str)
    ){

        return false;
    }

    let d =
        new Date(
            str+
            "T00:00:00"
        );

    if(
        isNaN(
            d.getTime()
        )
    ){

        return false;
    }

    let y =
        d.getFullYear();

    let m =
        String(
            d.getMonth()+1
        ).padStart(
            2,
            "0"
        );

    let day =
        String(
            d.getDate()
        ).padStart(
            2,
            "0"
        );

    return (
        `${y}-${m}-${day}`===
        str
    );
}


// ============================================================
// 时间格式检查
// ============================================================

function isValidTimeString(str){

    if(
        typeof str!=="string" ||
        !/^\d{2}:\d{2}$/.test(str)
    ){

        return false;
    }

    let arr =
        str.split(":");

    let h =
        Number(arr[0]);

    let m =
        Number(arr[1]);

    return (
        h>=0 &&
        h<=23 &&
        m>=0 &&
        m<=59
    );
}


// ============================================================
// 时间
// ============================================================

const min10List = [

    0,
    10,
    20,
    30,
    40,
    50
];


// ============================================================
// 10分钟取整
// ============================================================

function round10Minute(minute){

    let v =
        Math.round(
            Number(minute)/10
        )*10;

    if(v>=60){

        v=50;
    }

    if(v<0){

        v=0;
    }

    return v;
}


// ============================================================
// 时间转小时
// ============================================================

function timeToHour(str){

    let arr =
        String(str)
        .split(":")
        .map(Number);

    return Number(arr[0])+
        Number(arr[1])/60;
}


// ============================================================
// V19：统一工时计算
// 支持跨午夜
// ============================================================

function calculateWorkHour(
    clockIn,
    clockOut,
    restHour
){

    let hIn =
        timeToHour(
            clockIn
        );

    let hOut =
        timeToHour(
            clockOut
        );

    let rawHour =
        hOut-hIn;


    // --------------------------------------------------------
    // 同一时间
    // --------------------------------------------------------

    if(rawHour===0){

        return {

            valid:false,

            rawHour:0,

            workHour:0,

            message:
                "上班和下班时间不能相同"
        };
    }


    // --------------------------------------------------------
    // 跨午夜
    // --------------------------------------------------------

    if(rawHour<0){

        rawHour+=24;
    }


    let rest =
        Number(
            restHour||0
        );

    let workHour =
        rawHour-rest;


    // --------------------------------------------------------
    // 最大时间保护
    // --------------------------------------------------------

    if(rawHour>24){

        return {

            valid:false,

            rawHour:rawHour,

            workHour:workHour,

            message:
                "工作时间异常"
        };
    }


    return {

        valid:true,

        rawHour:rawHour,

        workHour:workHour
    };
}


// ============================================================
// 剪贴板
// ============================================================

function copyText(text){

    let ClipData =
        android.content.ClipData;

    let cm =
        context.getSystemService(
            "clipboard"
        );

    let clip =
        ClipData.newPlainText(
            "考勤记录",
            text
        );

    cm.setPrimaryClip(
        clip
    );

    toast(
        "已复制文本"
    );
}


// ============================================================
// 备份文件识别
// ============================================================

function getBackupFileNames(){

    if(
        !files.exists(
            BACKUP_FOLDER
        )
    ){

        return [];
    }

    return files.listDir(
        BACKUP_FOLDER
    )
    .filter(
        n=>
            n.endsWith(".json") &&
            n.indexOf(
                "kaoqin_backup_"
            )===0
    );
}


// ============================================================
// 确保备份目录
// ============================================================

function ensureBackupFolder(){

    const bakDir =
        new java.io.File(
            BACKUP_FOLDER
        );

    if(!bakDir.exists()){

        bakDir.mkdirs();
    }

    return bakDir.exists();
}


// ============================================================
// 创建备份快照
// ============================================================

function createBackupSnapshot(){

    if(
        !ensureBackupFolder()
    ){

        return {

            success:false,

            created:false,

            path:"",

            message:
                "备份目录创建失败"
        };
    }


    let currentRecords =
        loadRecords();


    let currentJsonText =
        JSON.stringify(
            currentRecords,
            null,
            2
        );


    let bakFileList =
        getBackupFileNames();


    // --------------------------------------------------------
    // 如果已经存在完全相同的数据
    // 不重复创建
    // --------------------------------------------------------

    for(
        let fname of bakFileList
    ){

        try{

            let fp =
                files.join(
                    BACKUP_FOLDER,
                    fname
                );

            if(
                files.read(fp)===
                currentJsonText
            ){

                return {

                    success:true,

                    created:false,

                    path:fp,

                    message:
                        "当前数据已有完全一致的备份"
                };
            }

        }catch(e){

            // 单个备份读取失败
            // 不影响继续检查其他备份
        }
    }


    // --------------------------------------------------------
    // 生成时间戳
    // --------------------------------------------------------

    let d =
        new Date();

    let ts =
        `${d.getFullYear()}`+
        `${String(
            d.getMonth()+1
        ).padStart(2,"0")}`+
        `${String(
            d.getDate()
        ).padStart(2,"0")}_`+
        `${String(
            d.getHours()
        ).padStart(2,"0")}`+
        `${String(
            d.getMinutes()
        ).padStart(2,"0")}`+
        `${String(
            d.getSeconds()
        ).padStart(2,"0")}`;


    let bakPath =
        files.join(
            BACKUP_FOLDER,
            `kaoqin_backup_${ts}.json`
        );


    // --------------------------------------------------------
    // 防止同秒重复
    // --------------------------------------------------------

    let counter=1;

    while(
        files.exists(
            bakPath
        )
    ){

        bakPath =
            files.join(
                BACKUP_FOLDER,
                `kaoqin_backup_${ts}_${counter}.json`
            );

        counter++;
    }


    // --------------------------------------------------------
    // 写入备份
    // --------------------------------------------------------

    try{

        files.write(
            bakPath,
            currentJsonText
        );

        return {

            success:true,

            created:true,

            path:bakPath,

            message:
                "备份快照创建成功"
        };

    }catch(e){

        return {

            success:false,

            created:false,

            path:"",

            message:
                "备份写入失败："+e.message
        };
    }
}


// ============================================================
// 手动备份
// ============================================================

function manualBackup(){

    let result =
        createBackupSnapshot();


    if(!result.success){

        ui.logText.text(
            "⚠️备份记录失败\n"+
            result.message
        );

        return;
    }


    if(!result.created){

        ui.logText.text(
            "ℹ️当前数据与已有备份完全一致\n"+
            "无需重复备份"
        );

        return;
    }


    let currentRecords =
        loadRecords();


    ui.logText.text(
        `✅备份记录完成\n`+
        `记录数量：${currentRecords.length} 条\n`+
        `${result.path}`
    );
}


// ============================================================
// V20.1：备份完整性检查
// ============================================================

function validateBackupData(data){

    if(!Array.isArray(data)){

        return {

            valid:false,

            count:0,

            message:
                "备份内容不是有效记录数组"
        };
    }


    if(data.length===0){

        return {

            valid:true,

            count:0,

            message:
                "备份为空记录"
        };
    }


    let dateMap={};


    for(
        let i=0;
        i<data.length;
        i++
    ){

        let r =
            data[i];


        if(
            !r ||
            typeof r!=="object"
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录不是有效对象`
            };
        }


        if(
            !isValidDateString(
                r.date
            )
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录的日期无效：${r.date}`
            };
        }


        if(
            dateMap[r.date]
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `发现重复日期：${r.date}`
            };
        }

        dateMap[r.date]=true;


        if(
            !isValidTimeString(
                r.clockIn
            )
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录的上班时间无效：${r.clockIn}`
            };
        }


        if(
            !isValidTimeString(
                r.clockOut
            )
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录的下班时间无效：${r.clockOut}`
            };
        }


        let rest =
            Number(
                r.restHour
            );

        if(
            isNaN(rest) ||
            rest<0 ||
            rest>24
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录的休息时间无效：${r.restHour}`
            };
        }


        let workHour =
            Number(
                r.workHour
            );

        if(
            isNaN(workHour) ||
            workHour<=0 ||
            workHour>24
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录的实际工时无效：${r.workHour}`
            };
        }


        let wage =
            Number(
                r.wage
            );

        if(
            isNaN(wage) ||
            wage<=0
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录的薪资无效：${r.wage}`
            };
        }


        let dayPay =
            Number(
                r.dayPay
            );

        if(
            isNaN(dayPay) ||
            dayPay<0
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录的工资无效：${r.dayPay}`
            };
        }


        let calc =
            calculateWorkHour(
                r.clockIn,
                r.clockOut,
                rest
            );


        if(!calc.valid){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录时间计算异常：${calc.message}`
            };
        }


        if(
            Math.abs(
                Number(
                    calc.workHour
                )-
                workHour
            )>0.02
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录工时与上下班时间不一致`
            };
        }


        let wageType =
            r.wageType==="day"
            ? "day"
            : "hour";

        let expectedPay =
            wageType==="day"
            ? Number(wage.toFixed(2))
            : Number(
                (
                    workHour*
                    wage
                ).toFixed(2)
            );


        if(
            Math.abs(
                expectedPay-dayPay
            )>0.02
        ){

            return {

                valid:false,

                count:data.length,

                message:
                    `第 ${i+1} 条记录工资计算异常`
            };
        }
    }


    return {

        valid:true,

        count:data.length,

        message:
            "备份完整性检查通过"
    };
}


// ============================================================
// 获取备份摘要
// ============================================================

function getBackupSummary(data){

    if(
        !Array.isArray(data) ||
        data.length===0
    ){

        return {

            count:0,

            first:"无",

            last:"无",

            hour:0,

            pay:0
        };
    }


    let list =
        data.filter(
            r=>
                r &&
                r.date
        ).slice();


    list.sort(
        (a,b)=>
            String(a.date)
            .localeCompare(
                String(b.date)
            )
    );


    let hour=0;

    let pay=0;


    data.forEach(r=>{

        hour +=
            Number(
                r.workHour
            )||0;

        pay +=
            Number(
                r.dayPay
            )||0;
    });


    return {

        count:
            data.length,

        first:
            list.length
            ?
            list[0].date
            :
            "无",

        last:
            list.length
            ?
            list[list.length-1].date
            :
            "无",

        hour:
            hour,

        pay:
            pay
    };
}


// ============================================================
// V20.1：恢复备份
// ============================================================

function importBackup(){

    if(
        !files.exists(
            BACKUP_FOLDER
        )
    ){

        ui.logText.text(
            "⚠️备份文件夹不存在，请先执行一次备份"
        );

        return;
    }


    let list =
        getBackupFileNames();


    if(list.length===0){

        ui.logText.text(
            "⚠️没有找到有效备份文件"
        );

        return;
    }


    list.sort().reverse();


    dialogs.select(
        "选择备份文件恢复",
        list,
        function(idx){

            if(idx<0){

                return;
            }


            let selFile =
                files.join(
                    BACKUP_FOLDER,
                    list[idx]
                );


            try{

                let data =
                    JSON.parse(
                        files.read(
                            selFile
                        )
                    );


                let check =
                    validateBackupData(
                        data
                    );


                if(!check.valid){

                    ui.logText.text(
                        "⚠️备份完整性检查失败\n"+
                        check.message+
                        "\n\n"+
                        "为了安全起见，已禁止恢复此备份。"
                    );

                    return;
                }


                let info =
                    getBackupSummary(
                        data
                    );


                let msg =
                    `备份文件：${list[idx]}\n\n`+
                    `完整性：${check.message}\n`+
                    `记录数量：${info.count} 条\n`+
                    `最早记录：${info.first}\n`+
                    `最新记录：${info.last}\n`+
                    `累计工时：${info.hour.toFixed(2)}h\n`+
                    `累计工资：¥${info.pay.toFixed(2)}\n\n`+
                    `恢复后会覆盖当前全部记录。\n`+
                    `恢复前系统会自动保护当前数据。\n\n`+
                    `确定继续吗？`;


                dialogs.confirm(
                    "确认恢复备份",
                    msg,
                    function(ok){

                        if(!ok){

                            return;
                        }


                        let protect =
                            createBackupSnapshot();


                        if(!protect.success){

                            ui.logText.text(
                                "⚠️恢复已取消\n"+
                                "恢复前自动备份失败：\n"+
                                protect.message+
                                "\n\n"+
                                "当前数据未被覆盖。"
                            );

                            return;
                        }


                        if(
                            !saveRecords(
                                data
                            )
                        ){

                            ui.logText.text(
                                "⚠️恢复失败\n"+
                                "当前数据保存失败，原数据文件未被正常覆盖。"
                            );

                            return;
                        }


                        editDate="";

                        updateEditModeUI();


                        if(protect.created){

                            ui.logText.text(
                                `✅恢复备份成功\n`+
                                `文件：${list[idx]}\n`+
                                `记录：${info.count} 条\n\n`+
                                `恢复前数据已自动备份：\n`+
                                `${protect.path}`
                            );

                        }else{

                            ui.logText.text(
                                `✅恢复备份成功\n`+
                                `文件：${list[idx]}\n`+
                                `记录：${info.count} 条\n\n`+
                                `恢复前数据已有相同备份，无需重复创建`
                            );
                        }

                    }
                );

            }catch(e){

                ui.logText.text(
                    "⚠️备份文件解析失败："+
                    e.message
                );
            }
        }
    );
}


// ============================================================
// 删除备份
// ============================================================

function deleteBackupFiles(){

    dialogs.confirm(
        "删除备份",
        "确定要进入备份删除界面？删除后不可恢复",
        ok=>{

            if(!ok){

                return;
            }


            if(
                !files.exists(
                    BACKUP_FOLDER
                )
            ){

                ui.logText.text(
                    "⚠️备份文件夹不存在"
                );

                return;
            }


            let fileNames =
                getBackupFileNames()
                .sort()
                .reverse();


            if(
                fileNames.length===0
            ){

                ui.logText.text(
                    "⚠️暂无有效备份文件"
                );

                return;
            }


            let checkArr =
                fileNames.map(
                    ()=>false
                );


            let dialogView =
                ui.inflate(`
                <vertical padding="16">

                    <text
                        text="勾选要删除的备份文件"
                        textSize="18sp"
                        margin="0 0 12 0"/>

                    <scroll
                        w="*"
                        h="400">

                        <vertical
                            id="container"/>

                    </scroll>

                    <horizontal
                        margin="12 16 0 0">

                        <button
                            id="dlgCancel"
                            text="取消"
                            layout_weight="1"/>

                        <button
                            id="dlgOk"
                            text="确认删除"
                            bg="#ff5722"
                            textColor="#ffffff"
                            layout_weight="1"/>

                    </horizontal>

                </vertical>
                `);


            let container =
                dialogView.container;


            for(
                let i=0;
                i<fileNames.length;
                i++
            ){

                let item =
                    ui.inflate(`
                    <horizontal padding="8">

                        <checkbox id="cb"/>

                        <text
                            id="txt"
                            layout_weight="1"
                            textSize="14sp"/>

                    </horizontal>
                    `);


                item.txt.text(
                    fileNames[i]
                );


                let idx=i;


                item.cb.on(
                    "check",
                    v=>{

                        checkArr[idx]=v;
                    }
                );


                container.addView(
                    item
                );
            }


            let d =
                dialogs.build({
                    customView:dialogView,
                    cancelable:true
                }).show();


            dialogView.dlgCancel.click(
                ()=>d.dismiss()
            );


            dialogView.dlgOk.click(()=>{

                d.dismiss();


                let delList=[];


                for(
                    let i=0;
                    i<checkArr.length;
                    i++
                ){

                    if(checkArr[i]){

                        delList.push(
                            fileNames[i]
                        );
                    }
                }


                if(
                    delList.length===0
                ){

                    ui.logText.text(
                        "⚠️未勾选备份文件"
                    );

                    return;
                }


                delList.forEach(fn=>{

                    try{

                        files.remove(
                            files.join(
                                BACKUP_FOLDER,
                                fn
                            )
                        );

                    }catch(e){}
                });


                ui.logText.text(
                    `✅已删除备份 ${delList.length} 个`
                );
            });
        }
    );
}


// ============================================================
// 导出 CSV
// ============================================================

function exportCsv(){

    let list =
        loadRecords();


    if(list.length===0){

        ui.logText.text(
            "⚠️没有记录可导出"
        );

        return;
    }


    let sortList =
        list.slice().sort(
            (a,b)=>
                new Date(b.date)-
                new Date(a.date)
        );


    let downloadPath =
        files.getSdcardPath()+
        "/Download";


    if(
        !files.exists(
            downloadPath
        )
    ){

        files.createWithDirs(
            files.join(
                downloadPath,
                ".keep"
            )
        );

        try{

            files.remove(
                files.join(
                    downloadPath,
                    ".keep"
                )
            );

        }catch(e){}
    }


    let csvPath =
        files.join(
            downloadPath,
            "考勤记录_v19.csv"
        );


    let content =
        "日期,上班,下班,休息,实际工时,薪资,计薪单位,当日工资\n";


    sortList.forEach(item=>{

        content +=
            `${item.date},`+
            `${item.clockIn},`+
            `${item.clockOut},`+
            `${item.restHour},`+
            `${item.workHour},`+
            `${item.wage},`+
            `${item.wageType==="day" ? "天" : "小时"},`+
            `${item.dayPay}\n`;
    });


    try{

        files.write(
            csvPath,
            content
        );


        ui.logText.text(
            `✅CSV导出成功\n文件路径：${csvPath}`
        );

    }catch(e){

        ui.logText.text(
            "⚠️CSV导出失败："+e.message
        );
    }
}


// ============================================================
// 导出 TXT
// ============================================================

function exportTxt(){

    let list =
        loadRecords();


    if(list.length===0){

        ui.logText.text(
            "⚠️无记录"
        );

        return;
    }


    let sortList =
        list.slice().sort(
            (a,b)=>
                new Date(b.date)-
                new Date(a.date)
        );


    let downloadPath =
        files.getSdcardPath()+
        "/Download";


    if(
        !files.exists(
            downloadPath
        )
    ){

        files.createWithDirs(
            files.join(
                downloadPath,
                ".keep"
            )
        );

        try{

            files.remove(
                files.join(
                    downloadPath,
                    ".keep"
                )
            );

        }catch(e){}
    }


    let txtPath =
        files.join(
            downloadPath,
            "考勤记录_v19.txt"
        );


    let s =
        "====考勤记录 V20.2====\n";


    sortList.forEach(o=>{

        let md =
            o.date.substring(5);

        s +=
            `${md} ${getWeekDay(o.date)}｜`+
            `${o.clockIn}-${o.clockOut}｜`+
            `休息${Number(
                o.restHour||0
            ).toFixed(2)}h｜`+
            `工时${Number(
                o.workHour||0
            ).toFixed(2)}h｜`+
            `工资${Number(
                o.dayPay||0
            ).toFixed(2)}元\n`;
    });


    try{

        files.write(
            txtPath,
            s
        );


        ui.logText.text(
            `✅TXT文本导出成功\n${txtPath}`
        );

    }catch(e){

        ui.logText.text(
            "⚠️TXT导出失败："+e.message
        );
    }
}


// ============================================================
// 全局状态
// ============================================================

let setting =
    loadSetting();


let selectDate =
    getNowDate();


let selectClockIn =
    setting.clockIn ||
    "08:00";


let selectClockOut =
    setting.clockOut ||
    "18:00";


let selectRestHour =
    parseFloat(
        setting.restHour
    );


if(
    isNaN(
        selectRestHour
    )
){

    selectRestHour=1;
}


let currentWage =
    setting.wage ||
    "18";

let currentWageType =
    setting.wageType==="day"
    ? "day"
    : "hour";


// ------------------------------------------------------------
// 修改记录时使用原日期定位
// ------------------------------------------------------------

let editDate="";


// ============================================================
// 主界面
// ============================================================

ui.layout(`
<vertical padding="14">

    <text
        text="考勤工具 V20.2"
        textSize="22sp"
        gravity="center"
        textColor="#1976D2"
        textStyle="bold"
        margin="0 4 10 8"/>

    <!-- =====================================================
         考勤记录输入区：保留原有内容与顺序，仅调整视觉层次
         ===================================================== -->

    <card
        margin="0 0 10 0"
        cardCornerRadius="12dp"
        cardElevation="1dp">

        <vertical padding="12 8 12 12">

            <text
                text="考勤记录"
                textSize="15sp"
                textStyle="bold"
                textColor="#1976D2"
                margin="2 0 0 8"/>

            <horizontal
                gravity="center_vertical"
                margin="0 4 4 4">

                <text
                    text="薪资"
                    textSize="15sp"
                    textColor="#607D8B"
                    w="80"/>

                <button
                    id="tvWageVal"
                    text=""
                    layout_weight="1"
                    h="40"
                    textSize="17sp"
                    textStyle="bold"
                    gravity="center"
                    margin="0 0 0 4"/>

                <button
                    id="btnWageType"
                    text="小时"
                    h="40"
                    minWidth="58dp"
                    margin="4 0 0 0"/>

            </horizontal>


            <horizontal
                gravity="center_vertical"
                margin="0 4">

                <text
                    text="日期"
                    textSize="15sp"
                    textColor="#607D8B"
                    w="80"/>

                <button
                    id="btnPickDate"
                    text="{{selectDate}}"
                    layout_weight="1"
                    h="43"/>

            </horizontal>


            <horizontal
                gravity="center_vertical"
                margin="0 4">

                <text
                    text="上班"
                    textSize="15sp"
                    textColor="#607D8B"
                    w="80"/>

                <button
                    id="btnPickIn"
                    text="{{selectClockIn}}"
                    layout_weight="1"
                    h="43"/>

            </horizontal>


            <horizontal
                gravity="center_vertical"
                margin="0 4">

                <text
                    text="下班"
                    textSize="15sp"
                    textColor="#607D8B"
                    w="80"/>

                <button
                    id="btnPickOut"
                    text="{{selectClockOut}}"
                    layout_weight="1"
                    h="43"/>

            </horizontal>


            <horizontal
                gravity="center_vertical"
                margin="0 4 4 4">

                <text
                    text="休息"
                    textSize="15sp"
                    textColor="#607D8B"
                    w="80"/>

                <button
                    id="btnPickRest"
                    layout_weight="1"
                    h="43"/>

            </horizontal>


            <button
                id="btnAdd"
                text="保存记录"
                bg="#1976D2"
                textColor="#fff"
                h="46"
                margin="4 2 0 2"/>

            <button
                id="btnCancelEdit"
                text="取消修改"
                visibility="gone"
                h="40"
                margin="4 2 0 2"/>

        </vertical>

    </card>


    <!-- =====================================================
         考勤数据
         ===================================================== -->

    <text
        text="考勤数据"
        textSize="14sp"
        textStyle="bold"
        textColor="#607D8B"
        margin="4 4 2 6"/>

    <button
        id="btnShowPop"
        text="考勤统计"
        bg="#1976D2"
        textColor="#fff"
        h="44"
        margin="2"/>


    <!-- =====================================================
         记录管理
         ===================================================== -->

    <text
        text="记录管理"
        textSize="14sp"
        textStyle="bold"
        textColor="#607D8B"
        margin="8 4 2 6"/>

    <horizontal>

        <button
            id="btnEditRec"
            text="修改记录"
            bg="#1976D2"
            textColor="#fff"
            layout_weight="1"
            h="44"
            margin="2"/>

        <button
            id="btnDelSel"
            text="删除记录"
            bg="#E53935"
            textColor="#fff"
            layout_weight="1"
            h="44"
            margin="2"/>

    </horizontal>

    <button
        id="btnMoreFunctions"
        text="更多功能"
        bg="#1976D2"
        textColor="#fff"
        h="44"
        margin="4 2 2 2"/>


    <!-- =====================================================
         数据导出
         ===================================================== -->

    <text
        text="数据导出"
        textSize="14sp"
        textStyle="bold"
        textColor="#607D8B"
        margin="8 4 2 6"/>

    <horizontal>

        <button
            visibility="gone"
            id="btnExportCsv"
            text="导出 CSV"
            bg="#1976D2"
            textColor="#fff"
            layout_weight="1"
            h="44"
            margin="2"/>

        <button
            visibility="gone"
            id="btnExportTxt"
            text="导出 TXT"
            bg="#1976D2"
            textColor="#fff"
            layout_weight="1"
            h="44"
            margin="2"/>

    </horizontal>


    <!-- =====================================================
         数据安全
         ===================================================== -->

    <text
        text="数据安全"
        textSize="14sp"
        textStyle="bold"
        textColor="#607D8B"
        margin="8 4 2 6"/>

    <horizontal>

        <button
            visibility="gone"
            id="btnBak"
            text="备份记录"
            bg="#1976D2"
            textColor="#fff"
            layout_weight="1"
            h="44"
            margin="2"/>

        <button
            visibility="gone"
            id="btnRestore"
            text="导入备份"
            bg="#1976D2"
            textColor="#fff"
            layout_weight="1"
            h="44"
            margin="2"/>

    </horizontal>

    <button
        visibility="gone"
            id="btnDelBackup"
        text="删除备份"
        bg="#E53935"
        textColor="#fff"
        h="42"
        margin="2"/>


    <!-- =====================================================
         操作日志：降低视觉权重，仍保留原功能
         ===================================================== -->

    <scroll
        layout_weight="1"
        margin="4 8 0 8"
        fillViewport="true">

        <text
            id="logText"
            text="操作日志"
            textSize="12sp"
            textColor="#90A4AE"/>

    </scroll>

</vertical>
`);


// ============================================================
// 初始化界面
// ============================================================

ui.tvWageVal.text(
    currentWage
);

function updateWageTypeButtonText(){
    ui.btnWageType.text(
        currentWageType==="day"
        ? "天"
        : "小时"
    );
}

updateWageTypeButtonText();

ui.btnPickDate.text(
    selectDate
);

ui.btnPickIn.text(
    selectClockIn
);

ui.btnPickOut.text(
    selectClockOut
);


// ============================================================
// 休息时间按钮
// ============================================================

function updateRestButtonText(){

    let hh =
        Math.floor(
            selectRestHour
        );


    let mm =
        Math.round(
            (
                selectRestHour-
                hh
            )*60
        );


    if(mm>=60){

        hh++;

        mm=0;
    }


    ui.btnPickRest.text(
        `${hh}时${mm}分`
    );
}


updateRestButtonText();


// ============================================================
// V20.2：更新新增 / 修改模式 UI
// ============================================================

function updateEditModeUI(){

    if(editDate){

        ui.btnAdd.text(
            "保存修改"
        );

        ui.btnCancelEdit.setVisibility(
            android.view.View.VISIBLE
        );

    }else{

        ui.btnAdd.text(
            "保存记录"
        );

        ui.btnCancelEdit.setVisibility(
            android.view.View.GONE
        );
    }
}


// ============================================================
// V20.2：恢复新增模式默认设置
// ============================================================

function cancelEditMode(){

    editDate="";

    selectDate =
        getNowDate();

    selectClockIn =
        setting.clockIn ||
        "08:00";

    selectClockOut =
        setting.clockOut ||
        "18:00";

    selectRestHour =
        parseFloat(
            setting.restHour
        );

    if(
        isNaN(
            selectRestHour
        )
    ){

        selectRestHour=1;
    }

    currentWage =
        setting.wage ||
        "18";

    currentWageType =
        setting.wageType==="day"
        ? "day"
        : "hour";


    ui.btnPickDate.text(
        selectDate
    );

    ui.btnPickIn.text(
        selectClockIn
    );

    ui.btnPickOut.text(
        selectClockOut
    );

    updateRestButtonText();

    ui.tvWageVal.text(
        currentWage
    );

    updateWageTypeButtonText();

    updateEditModeUI();

    ui.logText.text(
        "↩️已取消修改\n"+
        "已恢复为新增考勤记录模式"
    );
}


updateEditModeUI();


// ============================================================
// 点击薪资数字修改
// ============================================================

ui.tvWageVal.click(()=>{

    dialogs.rawInput(
        "请输入薪资(数字)",
        currentWage,
        inputText=>{

            if(inputText===null){

                return;
            }


            let num =
                parseFloat(
                    inputText.trim()
                );


            if(
                isNaN(num) ||
                num<=0
            ){

                ui.logText.text(
                    "⚠️请输入有效的正数"
                );

                return;
            }


            currentWage =
                String(num);

            ui.tvWageVal.text(
                currentWage
            );


            let ok =
                saveSetting({

                    wage:
                        currentWage,

                    wageType:
                        currentWageType,

                    clockIn:
                        selectClockIn,

                    clockOut:
                        selectClockOut,

                    restHour:
                        String(
                            selectRestHour
                        )
                });


            if(ok){

                ui.logText.text(
                    `✅薪资已修改并保存：¥${currentWage} / ${currentWageType==="day" ? "天" : "小时"}`
                );
            }

        }
    );
});


// ============================================================
// 选择计薪单位：小时 / 天
// ============================================================

ui.btnWageType.click(()=>{

    dialogs.select(
        "选择计薪单位",
        [
            "小时",
            "天"
        ],
        index=>{

            if(index<0){
                return;
            }

            currentWageType =
                index===1
                ? "day"
                : "hour";

            updateWageTypeButtonText();

            let ok =
                saveSetting({

                    wage:
                        currentWage,

                    wageType:
                        currentWageType,

                    clockIn:
                        selectClockIn,

                    clockOut:
                        selectClockOut,

                    restHour:
                        String(
                            selectRestHour
                        )
                });

            if(ok){
                ui.logText.text(
                    `✅计薪单位已修改：${currentWageType==="day" ? "天" : "小时"}`
                );
            }
        }
    );
});


// ============================================================
// V20.2：自定义日期选择器
// ============================================================

function showCustomDatePicker(callback){

    let now =
        new Date();

    let currentYear =
        now.getFullYear();

    let currentMonth =
        now.getMonth()+1;

    let currentDay =
        now.getDate();


    let defaultArr =
        selectDate.split("-").map(Number);


    let defYear =
        defaultArr[0];

    let defMonth =
        defaultArr[1];

    let defDay =
        defaultArr[2];


    if(
        isNaN(defYear) ||
        isNaN(defMonth) ||
        isNaN(defDay)
    ){

        defYear=currentYear;
        defMonth=currentMonth;
        defDay=currentDay;
    }


    // --------------------------------------------------------
    // 年范围：当前年份前20年 ～ 当前年份后5年
    // --------------------------------------------------------

    let minYear =
        currentYear-20;

    let maxYear =
        currentYear+5;


    if(defYear<minYear){

        defYear=minYear;
    }

    if(defYear>maxYear){

        defYear=maxYear;
    }


    let view =
        ui.inflate(`
        <vertical padding="20">

            <text
                text="自定义日期"
                gravity="center"
                textSize="20sp"
                textStyle="bold"
                margin="0 0 16 0"/>

            <horizontal>

                <numberpicker
                    id="npYear"
                    min="${minYear}"
                    max="${maxYear}"
                    layout_weight="1"/>

                <text
                    text="年"
                    textSize="20sp"
                    textStyle="bold"
                    gravity="center"
                    layout_gravity="center_vertical"
                    w="28"/>

                <numberpicker
                    id="npMonth"
                    min="1"
                    max="12"
                    layout_weight="1"/>

                <text
                    text="月"
                    textSize="20sp"
                    textStyle="bold"
                    gravity="center"
                    layout_gravity="center_vertical"
                    w="28"/>

                <numberpicker
                    id="npDay"
                    min="1"
                    max="31"
                    layout_weight="1"/>

                <text
                    text="日"
                    textSize="20sp"
                    textStyle="bold"
                    gravity="center"
                    layout_gravity="center_vertical"
                    w="28"/>

            </horizontal>

            <horizontal
                margin="16 20 0 0">

                <button
                    id="btnCancel"
                    text="取消"
                    layout_weight="1"/>

                <button
                    id="btnOk"
                    text="确定"
                    bg="#2196F3"
                    textColor="#ffffff"
                    layout_weight="1"/>

            </horizontal>

        </vertical>
        `);


    view.npYear.setValue(
        defYear
    );

    view.npMonth.setValue(
        defMonth
    );

    view.npDay.setValue(
        defDay
    );


    let d =
        dialogs.build({
            customView:view,
            cancelable:true
        }).show();


    view.btnCancel.click(
        ()=>d.dismiss()
    );


    view.btnOk.click(()=>{

        let y =
            view.npYear.getValue();

        let m =
            view.npMonth.getValue();

        let day =
            view.npDay.getValue();


        let maxDay =
            new Date(
                y,
                m,
                0
            ).getDate();


        if(day>maxDay){

            ui.logText.text(
                `⚠️${y}年${m}月没有${day}日`
            );

            return;
        }


        let result =
            dateToString(
                y,
                m,
                day
            );


        if(
            !isValidDateString(
                result
            )
        ){

            ui.logText.text(
                "⚠️日期无效"
            );

            return;
        }


        callback(
            result
        );

        d.dismiss();
    });
}


// ============================================================
// 日期选择
// V20.2：最近730天 + 自定义日期
// ============================================================

ui.btnPickDate.click(()=>{

    let items=[];

    let values=[];


    // --------------------------------------------------------
    // 第一项：自定义日期
    // --------------------------------------------------------

    items.push(
        "📅 自定义日期"
    );

    values.push(
        "CUSTOM"
    );


    // --------------------------------------------------------
    // 最近730天
    // --------------------------------------------------------

    for(
        let i=0;
        i<=729;
        i++
    ){

        let t =
            new Date(
                Date.now()-
                i*86400000
            );


        let y =
            t.getFullYear();


        let m =
            String(
                t.getMonth()+1
            ).padStart(
                2,
                "0"
            );


        let d =
            String(
                t.getDate()
            ).padStart(
                2,
                "0"
            );


        let date =
            `${y}-${m}-${d}`;


        items.push(
            date
        );

        values.push(
            date
        );
    }


    dialogs.select(
        "选择日期",
        items,
        index=>{

            if(index<0){

                return;
            }


            if(
                values[index]==="CUSTOM"
            ){

                showCustomDatePicker(
                    result=>{

                        selectDate =
                            result;

                        ui.btnPickDate.text(
                            selectDate
                        );
                    }
                );

                return;
            }


            selectDate =
                values[index];

            ui.btnPickDate.text(
                selectDate
            );
        }
    );
});


// ============================================================
// 时间选择器
// ============================================================

function showTimePickerDialog(
    defaultTime,
    callback
){

    let arr =
        String(
            defaultTime
        )
        .split(":")
        .map(Number);


    let defH =
        arr[0];


    let defM =
        round10Minute(
            arr[1]
        );


    let idx =
        min10List.indexOf(
            defM
        );


    if(idx===-1){

        idx=0;
    }


    let pickerView =
        ui.inflate(`
        <vertical padding="20">

            <text
                text="选择时间"
                gravity="center"
                textSize="20sp"
                margin="0 0 16 0"/>

            <horizontal>

                <numberpicker
                    id="npHour"
                    min="0"
                    max="23"
                    layout_weight="1"/>

                <text
                    text="时"
                    textSize="22sp"
                    textStyle="bold"
                    gravity="center"
                    layout_gravity="center_vertical"
                    w="30"/>

                <numberpicker
                    id="npMin"
                    min="0"
                    max="5"
                    layout_weight="1"/>

                <text
                    text="分"
                    textSize="22sp"
                    textStyle="bold"
                    gravity="center"
                    layout_gravity="center_vertical"
                    w="30"/>

            </horizontal>


            <horizontal
                margin="16 20 0 0">

                <button
                    id="btnCancel"
                    text="取消"
                    layout_weight="1"/>

                <button
                    id="btnOk"
                    text="确定"
                    bg="#2196F3"
                    textColor="#ffffff"
                    layout_weight="1"/>

            </horizontal>

        </vertical>
        `);


    pickerView.npHour.setValue(
        defH
    );


    pickerView.npMin.setValue(
        idx
    );


    pickerView.npMin.setDisplayedValues(
        min10List.map(
            x=>String(x)
        )
    );


    let d =
        dialogs.build({
            customView:
                pickerView,
            cancelable:true
        }).show();


    pickerView.btnCancel.click(
        ()=>d.dismiss()
    );


    pickerView.btnOk.click(()=>{

        let h =
            String(
                pickerView.npHour.getValue()
            ).padStart(
                2,
                "0"
            );


        let minIdx =
            pickerView.npMin.getValue();


        let m =
            String(
                min10List[minIdx]
            ).padStart(
                2,
                "0"
            );


        callback(
            `${h}:${m}`
        );

        d.dismiss();
    });
}


// ============================================================
// 休息时间选择器
// ============================================================

function showRestHourPicker(
    defDecimalHour,
    callback
){

    let hh =
        Math.floor(
            defDecimalHour
        );


    let mm =
        round10Minute(
            Math.round(
                (
                    defDecimalHour-
                    hh
                )*60
            )
        );


    if(mm>=60){

        hh++;

        mm=0;
    }


    let idx =
        min10List.indexOf(
            mm
        );


    if(idx===-1){

        idx=0;
    }


    let view =
        ui.inflate(`
        <vertical padding="20">

            <text
                text="休息时长"
                gravity="center"
                textSize="20sp"
                margin="0 0 16 0"/>

            <horizontal>

                <numberpicker
                    id="npH"
                    min="0"
                    max="5"
                    layout_weight="1"/>

                <text
                    text="时"
                    textSize="22sp"
                    textStyle="bold"
                    gravity="center"
                    layout_gravity="center_vertical"
                    w="40"/>

                <numberpicker
                    id="npM"
                    min="0"
                    max="5"
                    layout_weight="1"/>

                <text
                    text="分"
                    textSize="22sp"
                    textStyle="bold"
                    gravity="center"
                    layout_gravity="center_vertical"
                    w="40"/>

            </horizontal>


            <horizontal
                margin="16 20 0 0">

                <button
                    id="btnCancel"
                    text="取消"
                    layout_weight="1"/>

                <button
                    id="btnOk"
                    text="确定"
                    bg="#2196F3"
                    textColor="#ffffff"
                    layout_weight="1"/>

            </horizontal>

        </vertical>
        `);


    view.npH.setValue(
        hh
    );


    view.npM.setValue(
        idx
    );


    view.npM.setDisplayedValues(
        min10List.map(
            x=>String(x)
        )
    );


    let d =
        dialogs.build({
            customView:view,
            cancelable:true
        }).show();


    view.btnCancel.click(
        ()=>d.dismiss()
    );


    view.btnOk.click(()=>{

        let selH =
            view.npH.getValue();


        let minIdx =
            view.npM.getValue();


        let selM =
            min10List[minIdx];


        let dec =
            selH+
            selM/60;


        callback(
            dec
        );

        d.dismiss();
    });
}


// ============================================================
// 选择上班时间
// ============================================================

ui.btnPickIn.click(()=>{

    showTimePickerDialog(
        selectClockIn,
        res=>{

            selectClockIn=res;


            ui.btnPickIn.text(
                selectClockIn
            );
        }
    );
});


// ============================================================
// 选择下班时间
// ============================================================

ui.btnPickOut.click(()=>{

    showTimePickerDialog(
        selectClockOut,
        res=>{

            selectClockOut=res;


            ui.btnPickOut.text(
                selectClockOut
            );
        }
    );
});


// ============================================================
// 选择休息时间
// ============================================================

ui.btnPickRest.click(()=>{

    showRestHourPicker(
        selectRestHour,
        decVal=>{

            selectRestHour =
                decVal;


            updateRestButtonText();
        }
    );
});


// ============================================================
// 保存记录 / 修改记录
// ============================================================

ui.btnAdd.click(()=>{

    let wageVal =
        parseFloat(
            currentWage
        );


    if(
        isNaN(wageVal) ||
        wageVal<=0
    ){

        ui.logText.text(
            "⚠️请先设置有效薪资"
        );

        return;
    }


    // --------------------------------------------------------
    // 日期检查
    // --------------------------------------------------------

    if(
        !isValidDateString(
            selectDate
        )
    ){

        ui.logText.text(
            "⚠️当前日期无效"
        );

        return;
    }


    // --------------------------------------------------------
    // 计算工时
    // --------------------------------------------------------

    let result =
        calculateWorkHour(
            selectClockIn,
            selectClockOut,
            selectRestHour
        );


    if(!result.valid){

        ui.logText.text(
            "⚠️"+result.message
        );

        return;
    }


    let rawHour =
        result.rawHour;


    let realHour =
        result.workHour;


    if(realHour<=0){

        ui.logText.text(
            "⚠️扣除休息后工时必须大于0"
        );

        return;
    }


    if(realHour>24){

        ui.logText.text(
            "⚠️实际工时不能超过24小时"
        );

        return;
    }


    let dayPay =
        currentWageType==="day"
        ? Number(wageVal.toFixed(2))
        : Number(
            (
                realHour*
                wageVal
            ).toFixed(2)
        );


    let item={

        date:
            selectDate,

        clockIn:
            selectClockIn,

        clockOut:
            selectClockOut,

        restHour:
            Number(
                selectRestHour.toFixed(2)
            ),

        workHour:
            Number(
                realHour.toFixed(2)
            ),

        wage:
            wageVal,

        wageType:
            currentWageType,

        dayPay:
            dayPay
    };


    let arr =
        loadRecords();


    // ========================================================
    // 修改模式
    // ========================================================

    if(editDate){

        let editIndex =
            arr.findIndex(
                r=>
                    r.date===editDate
            );


        if(editIndex===-1){

            ui.logText.text(
                "⚠️找不到需要修改的原记录"
            );

            editDate="";

            updateEditModeUI();

            return;
        }


        let duplicateIndex =
            arr.findIndex(
                (r,i)=>
                    r.date===item.date &&
                    i!==editIndex
            );


        if(duplicateIndex!==-1){

            ui.logText.text(
                `⚠️日期 ${selectDate} 已存在记录，无法修改`
            );

            return;
        }


        arr[editIndex]=item;


        if(
            !saveRecords(
                arr
            )
        ){

            return;
        }


        let settingOk =
            saveSetting({

                wage:
                    currentWage,

                wageType:
                    currentWageType,

                clockIn:
                    selectClockIn,

                clockOut:
                    selectClockOut,

                restHour:
                    String(
                        selectRestHour
                    )
            });


        editDate="";

        updateEditModeUI();


        if(settingOk){

            ui.logText.text(
                `✅记录已修改保存\n`+
                `日期：${item.date}\n`+
                `上班：${item.clockIn}  下班：${item.clockOut}\n`+
                `休息：${item.restHour.toFixed(2)}h\n`+
                `实际工时：${item.workHour.toFixed(2)}h\n`+
                `当日工资：${item.dayPay.toFixed(2)}元`
            );

        }else{

            ui.logText.text(
                `✅记录已修改保存\n`+
                `日期：${item.date}\n`+
                `实际工时：${item.workHour.toFixed(2)}h\n`+
                `当日工资：${item.dayPay.toFixed(2)}元\n\n`+
                `⚠️最近使用设置保存失败`
            );
        }


        return;
    }


    // ========================================================
    // 新增模式
    // ========================================================

    let existIndex =
        arr.findIndex(
            r=>
                r.date===selectDate
        );


    if(existIndex!==-1){

        ui.logText.text(
            `⚠️日期 ${selectDate} 已存在记录，请使用【修改记录】功能更新`
        );

        return;
    }


    arr.push(
        item
    );


    if(
        !saveRecords(
            arr
        )
    ){

        return;
    }


    let settingOk =
        saveSetting({

            wage:
                currentWage,

            wageType:
                currentWageType,

            clockIn:
                selectClockIn,

            clockOut:
                selectClockOut,

            restHour:
                String(
                    selectRestHour
                )
        });


    if(settingOk){

        ui.logText.text(
            `✅保存成功\n`+
            `日期：${selectDate}\n`+
            `上班：${selectClockIn}  下班：${selectClockOut}\n`+
            `休息：${selectRestHour.toFixed(2)}h\n`+
            `实际工时：${realHour.toFixed(2)}h\n`+
            `当日工资：${dayPay.toFixed(2)}元`
        );

    }else{

        ui.logText.text(
            `✅保存成功\n`+
            `日期：${selectDate}\n`+
            `上班：${selectClockIn}  下班：${selectClockOut}\n`+
            `休息：${selectRestHour.toFixed(2)}h\n`+
            `实际工时：${realHour.toFixed(2)}h\n`+
            `当日工资：${dayPay.toFixed(2)}元\n\n`+
            `⚠️最近使用设置保存失败`
        );
    }


    editDate="";

    updateEditModeUI();
});


// ============================================================
// V20.2：取消修改
// ============================================================

ui.btnCancelEdit.click(()=>{

    if(!editDate){

        return;
    }


    dialogs.confirm(
        "取消修改",
        `当前正在修改：${editDate}\n\n`+
        `取消后，本次修改内容不会保存。\n`+
        `确定取消吗？`,
        ok=>{

            if(!ok){

                return;
            }

            cancelEditMode();
        }
    );
});


// ============================================================
// 删除记录
// ============================================================

ui.btnDelSel.click(()=>{

    let a =
        Math.floor(
            Math.random()*90
        )+10;


    let b =
        Math.floor(
            Math.random()*90
        )+10;


    let ans =
        a+b;


    dialogs.rawInput(
        `⚠️即将进入删除记录，请计算：${a} + ${b} = ?`,
        "",
        input=>{

            if(input===null){

                return;
            }


            let user =
                parseInt(
                    input.trim()
                );


            if(
                isNaN(user) ||
                user!==ans
            ){

                ui.logText.text(
                    "⚠️计算错误，取消删除"
                );

                return;
            }


            let arr =
                loadRecords();


            if(arr.length===0){

                ui.logText.text(
                    "⚠️暂无记录"
                );

                return;
            }


            let recList =
                arr;


            let checkArr =
                recList.map(
                    ()=>false
                );


            let dialogView =
                ui.inflate(`
                <vertical padding="16">

                    <text
                        text="勾选要删除的记录"
                        textSize="18sp"
                        margin="0 0 12 0"/>

                    <scroll
                        w="*"
                        h="400">

                        <vertical
                            id="container"/>

                    </scroll>


                    <horizontal
                        margin="12 16 0 0">

                        <button
                            id="dlgCancel"
                            text="取消"
                            layout_weight="1"/>

                        <button
                            id="dlgOk"
                            text="确认删除"
                            bg="#ff5722"
                            textColor="#ffffff"
                            layout_weight="1"/>

                    </horizontal>

                </vertical>
                `);


            let container =
                dialogView.container;


            for(
                let i=0;
                i<recList.length;
                i++
            ){

                let o =
                    recList[i];


                let checkItem =
                    ui.inflate(`
                    <horizontal padding="8">

                        <checkbox id="cb"/>

                        <text
                            id="txt"
                            layout_weight="1"
                            textSize="14sp"/>

                    </horizontal>
                    `);


                checkItem.txt.text(
                    `${o.date} ${getWeekDay(o.date)} `+
                    `${o.clockIn}-${o.clockOut} `+
                    `休息${o.restHour}h`
                );


                let idx=i;


                checkItem.cb.on(
                    "check",
                    v=>{

                        checkArr[idx]=v;
                    }
                );


                container.addView(
                    checkItem
                );
            }


            let d =
                dialogs.build({
                    customView:
                        dialogView,
                    cancelable:true
                }).show();


            dialogView.dlgCancel.click(
                ()=>d.dismiss()
            );


            dialogView.dlgOk.click(()=>{

                d.dismiss();


                let delIndex=[];


                for(
                    let i=0;
                    i<checkArr.length;
                    i++
                ){

                    if(checkArr[i]){

                        delIndex.push(i);
                    }
                }


                if(
                    delIndex.length===0
                ){

                    ui.logText.text(
                        "⚠️未勾选任何记录"
                    );

                    return;
                }


                delIndex.sort(
                    (a,b)=>b-a
                )
                .forEach(
                    ii=>{

                        recList.splice(
                            ii,
                            1
                        );
                    }
                );


                if(
                    !saveRecords(
                        recList
                    )
                ){

                    return;
                }


                if(
                    editDate &&
                    !recList.some(
                        r=>
                            r.date===editDate
                    )
                ){

                    editDate="";

                    updateEditModeUI();
                }


                ui.logText.text(
                    `✅已删除 ${delIndex.length} 条记录`
                );
            });
        }
    );
});


// ============================================================
// 开始修改记录
// ============================================================

function startEditRecord(rec){

    if(
        !rec ||
        !rec.date
    ){

        return;
    }


    editDate =
        rec.date;


    selectDate =
        rec.date;


    selectClockIn =
        rec.clockIn;


    selectClockOut =
        rec.clockOut;


    selectRestHour =
        Number(
            rec.restHour
        )||0;


    currentWage =
        String(
            rec.wage
        );

    currentWageType =
        rec.wageType==="day"
        ? "day"
        : "hour";


    ui.btnPickDate.text(
        selectDate
    );


    ui.btnPickIn.text(
        selectClockIn
    );


    ui.btnPickOut.text(
        selectClockOut
    );


    updateRestButtonText();


    ui.tvWageVal.text(
        currentWage
    );

    updateWageTypeButtonText();


    updateEditModeUI();


    ui.logText.text(
        `✏️正在修改：${rec.date}\n`+
        `修改各项后，点击【保存修改】完成更新`
    );
}


// ============================================================
// 修改记录
// ============================================================

ui.btnEditRec.click(()=>{

    let arr =
        loadRecords();


    if(arr.length===0){

        ui.logText.text(
            "⚠️暂无记录可修改"
        );

        return;
    }


    arr.sort(
        (a,b)=>
            new Date(b.date)-
            new Date(a.date)
    );


    let opts =
        arr.map(
            o=>
                `${o.date} ${getWeekDay(o.date)} `+
                `${o.clockIn}-${o.clockOut} `+
                `休息${o.restHour}h`
        );


    dialogs.select(
        "选择要修改的一条记录",
        opts,
        selIdx=>{

            if(selIdx<0){

                return;
            }


            startEditRecord(
                arr[selIdx]
            );
        }
    );
});


// ============================================================
// 考勤统计中心
// ============================================================

ui.btnShowPop.click(()=>{

    let allArr =
        loadRecords();


    let currentYM =
        getNowDate().substring(
            0,
            7
        );


    let currentFilter =
        "all";


    let selectedMonth =
        currentYM;


    // ========================================================
    // 获取已有月份
    // ========================================================

    function getAvailableMonths(){

        let set={};


        allArr.forEach(r=>{

            if(
                !r ||
                !r.date
            ){

                return;
            }


            let ym =
                String(
                    r.date
                ).substring(
                    0,
                    7
                );


            if(
                /^\d{4}-\d{2}$/.test(
                    ym
                )
            ){

                set[ym]=true;
            }
        });


        return Object.keys(set)
            .sort()
            .reverse();
    }


    // ========================================================
    // V20.2：详细统计
    // ========================================================

    function calcStats(arr){

        let hour=0;

        let pay=0;

        arr.forEach(r=>{

            let h =
                Number(
                    r.workHour
                )||0;

            let p =
                Number(
                    r.dayPay
                )||0;


            hour += h;

            pay += p;
        });


        return {

            days:
                arr.length,

            hour:
                hour,

            pay:
                pay,

            avgHour:
                arr.length
                ?
                hour/arr.length
                :
                0,

            avgPay:
                arr.length
                ?
                pay/arr.length
                :
                0
        };
    }

    // ========================================================
    // V20.2：月份详细统计
    // ========================================================

    function getMonthDetailText(g){

        if(
            !g ||
            !g.list ||
            g.list.length===0
        ){

            return "";
        }


        let stats =
            calcStats(
                g.list
            );


        return `日均工时 ${stats.avgHour.toFixed(2)}h  · `+
            `日均工资 ¥${stats.avgPay.toFixed(2)}`;
    }

    // ========================================================
    // V20.2：年度月度统计
    // ========================================================

    function calcYearSummary(arr){

        let monthMap={};


        arr.forEach(r=>{

            if(
                !r ||
                !r.date
            ){

                return;
            }


            let ym =
                r.date.substring(
                    0,
                    7
                );


            if(!monthMap[ym]){

                monthMap[ym]={

                    month:ym,

                    days:0,

                    hour:0,

                    pay:0
                };
            }


            monthMap[ym].days++;

            monthMap[ym].hour +=
                Number(
                    r.workHour
                )||0;

            monthMap[ym].pay +=
                Number(
                    r.dayPay
                )||0;
        });


        let months =
            Object.keys(
                monthMap
            )
            .sort()
            .reverse()
            .map(
                ym=>
                    monthMap[ym]
            );


        let highestPayMonth=null;

        let lowestPayMonth=null;

        let highestHourMonth=null;

        let lowestHourMonth=null;


        months.forEach(m=>{

            if(
                !highestPayMonth ||
                m.pay>highestPayMonth.pay
            ){

                highestPayMonth=m;
            }


            if(
                !lowestPayMonth ||
                m.pay<lowestPayMonth.pay
            ){

                lowestPayMonth=m;
            }


            if(
                !highestHourMonth ||
                m.hour>highestHourMonth.hour
            ){

                highestHourMonth=m;
            }


            if(
                !lowestHourMonth ||
                m.hour<lowestHourMonth.hour
            ){

                lowestHourMonth=m;
            }
        });


        return {

            months:months,

            highestPayMonth:
                highestPayMonth,

            lowestPayMonth:
                lowestPayMonth,

            highestHourMonth:
                highestHourMonth,

            lowestHourMonth:
                lowestHourMonth
        };
    }


    // ========================================================
    // 弹窗界面
    // ========================================================

    let popView =
        ui.inflate(`
        <vertical padding="0">

            <text
                id="popTitle"
                text="考勤统计中心"
                textSize="21sp"
                textStyle="bold"
                gravity="center"
                padding="0 12 8 12"/>


            <horizontal
                padding="8 0 8 0">

                <button
                    id="filterAll"
                    text="全部"
                    layout_weight="1"
                    h="42"
                    margin="2"/>

                <button
                    id="filterCurrent"
                    text="本月"
                    layout_weight="1"
                    h="42"
                    margin="2"/>

                <button
                    id="filterSelect"
                    text="选择月份"
                    layout_weight="1"
                    h="42"
                    margin="2"/>

                <button
                    id="filterYear"
                    text="今年"
                    layout_weight="1"
                    h="42"
                    margin="2"/>

            </horizontal>


            <card
                id="totalCard"
                margin="8 0 12 0"
                cardCornerRadius="10dp"
                cardElevation="2dp">

                <vertical padding="12">

                    <horizontal>

                        <vertical
                            layout_weight="1"
                            gravity="center">

                            <text
                                id="totalDaysText"
                                textSize="22sp"
                                textStyle="bold"
                                gravity="center"/>

                            <text
                                text="出勤"
                                textSize="13sp"
                                gravity="center"/>

                        </vertical>


                        <vertical
                            layout_weight="1"
                            gravity="center">

                            <text
                                id="totalHourText"
                                textSize="22sp"
                                textStyle="bold"
                                gravity="center"/>

                            <text
                                text="总工时"
                                textSize="13sp"
                                gravity="center"/>

                        </vertical>


                        <vertical
                            layout_weight="1"
                            gravity="center">

                            <text
                                id="totalPayText"
                                textSize="22sp"
                                textStyle="bold"
                                gravity="center"/>

                            <text
                                text="总工资"
                                textSize="13sp"
                                gravity="center"/>

                        </vertical>

                    </horizontal>


                    <horizontal
                        margin="0 10 0 0">

                        <vertical
                            layout_weight="1"
                            gravity="center">

                            <text
                                id="avgHourText"
                                textSize="16sp"
                                textStyle="bold"
                                gravity="center"/>

                            <text
                                text="日均工时"
                                textSize="12sp"
                                gravity="center"/>

                        </vertical>


                        <vertical
                            layout_weight="1"
                            gravity="center">

                            <text
                                id="avgPayText"
                                textSize="16sp"
                                textStyle="bold"
                                gravity="center"/>

                            <text
                                id="avgPayLabel"
                                text="日均工资"
                                textSize="12sp"
                                gravity="center"/>

                        </vertical>

                    </horizontal>


                    <!-- V20.2：详细统计 -->

                    <text
                        id="detailStatsText"
                        textSize="13sp"
                        margin="0 12 0 0"/>

                </vertical>

            </card>


            <scroll
                id="recordScroll"
                w="*"
                h="0"
                layout_weight="1"
                fillViewport="true">

                <vertical
                    id="monthContainer"
                    padding="12 0 12 0"/>

            </scroll>


            <horizontal
                padding="8 6 8 6">

                <button
                    id="popCopy"
                    text="复制当前记录"
                    layout_weight="1"
                    h="46"
                    margin="2"/>

                <button
                    id="popClose"
                    text="关闭"
                    layout_weight="1"
                    h="46"
                    margin="2"/>

            </horizontal>

        </vertical>
        `);


    // ========================================================
    // 每日详情
    // ========================================================

    function showDayDetail(record){

        let detailView =
            ui.inflate(`
            <vertical padding="20">

                <text
                    id="detailTitle"
                    textSize="21sp"
                    textStyle="bold"
                    gravity="center"
                    margin="0 0 16 0"/>


                <card
                    cardCornerRadius="10dp"
                    cardElevation="1dp">

                    <vertical padding="16">

                        <horizontal margin="0 5">

                            <text
                                text="上班时间"
                                textSize="15sp"
                                layout_weight="1"/>

                            <text
                                id="dClockIn"
                                textSize="16sp"
                                textStyle="bold"
                                gravity="right"/>

                        </horizontal>


                        <horizontal margin="0 5">

                            <text
                                text="下班时间"
                                textSize="15sp"
                                layout_weight="1"/>

                            <text
                                id="dClockOut"
                                textSize="16sp"
                                textStyle="bold"
                                gravity="right"/>

                        </horizontal>


                        <horizontal margin="0 5">

                            <text
                                text="休息时间"
                                textSize="15sp"
                                layout_weight="1"/>

                            <text
                                id="dRest"
                                textSize="16sp"
                                gravity="right"/>

                        </horizontal>


                        <horizontal margin="0 5">

                            <text
                                text="实际工时"
                                textSize="15sp"
                                layout_weight="1"/>

                            <text
                                id="dWork"
                                textSize="16sp"
                                textStyle="bold"
                                gravity="right"/>

                        </horizontal>


                        <horizontal margin="0 5">

                            <text
                                text="薪资"
                                textSize="15sp"
                                layout_weight="1"/>

                            <text
                                id="dWage"
                                textSize="16sp"
                                gravity="right"/>

                        </horizontal>


                        <horizontal margin="0 5">

                            <text
                                text="当日工资"
                                textSize="15sp"
                                layout_weight="1"/>

                            <text
                                id="dPay"
                                textSize="20sp"
                                textStyle="bold"
                                gravity="right"/>

                        </horizontal>

                    </vertical>

                </card>


                <horizontal
                    margin="0 16 0 0">

                    <button
                        id="detailEdit"
                        text="修改"
                        bg="#FF9800"
                        textColor="#ffffff"
                        layout_weight="1"
                        h="46"
                        margin="2"/>

                    <button
                        id="detailClose"
                        text="关闭"
                        layout_weight="1"
                        h="46"
                        margin="2"/>

                </horizontal>

            </vertical>
            `);


        detailView.detailTitle.text(
            `${record.date} ${getWeekDay(record.date)}`
        );


        detailView.dClockIn.text(
            record.clockIn
        );


        detailView.dClockOut.text(
            record.clockOut
        );


        detailView.dRest.text(
            Number(
                record.restHour||0
            ).toFixed(2)+"h"
        );


        detailView.dWork.text(
            Number(
                record.workHour||0
            ).toFixed(2)+"h"
        );


        detailView.dWage.text(
            "¥"+
            Number(
                record.wage||0
            ).toFixed(2)+
            " / "+
            (record.wageType==="day" ? "天" : "小时")
        );


        detailView.dPay.text(
            "¥"+
            Number(
                record.dayPay||0
            ).toFixed(2)
        );


        let detailDialog =
            dialogs.build({
                customView:
                    detailView,
                cancelable:true
            }).show();


        detailView.detailClose.click(
            ()=>detailDialog.dismiss()
        );


        detailView.detailEdit.click(()=>{

            detailDialog.dismiss();


            startEditRecord(
                record
            );


            d.dismiss();
        });
    }


    // ========================================================
    // 渲染统计页面
    // ========================================================

    function renderRecords(){

        let arr =
            allArr.slice();


        // ----------------------------------------------------
        // 筛选
        // ----------------------------------------------------

        if(
            currentFilter==="current"
        ){

            arr =
                arr.filter(r=>{

                    return (
                        r.date &&
                        r.date.substring(
                            0,
                            7
                        )===
                        currentYM
                    );
                });
        }


        if(
            currentFilter==="selectMonth"
        ){

            arr =
                arr.filter(r=>{

                    return (
                        r.date &&
                        r.date.substring(
                            0,
                            7
                        )===
                        selectedMonth
                    );
                });
        }


        if(
            currentFilter==="year"
        ){

            let year =
                currentYM.substring(
                    0,
                    4
                );


            arr =
                arr.filter(r=>{

                    return (
                        r.date &&
                        r.date.substring(
                            0,
                            4
                        )===
                        year
                    );
                });
        }


        // ----------------------------------------------------
        // 排序
        // ----------------------------------------------------

        arr.sort(
            (a,b)=>
                new Date(b.date)-
                new Date(a.date)
        );


        // ----------------------------------------------------
        // 总统计
        // ----------------------------------------------------

        let stats =
            calcStats(
                arr
            );


        popView.totalDaysText.text(
            String(
                stats.days
            )
        );


        popView.totalHourText.text(
            stats.hour.toFixed(2)+
            "h"
        );


        popView.totalPayText.text(
            "¥"+
            stats.pay.toFixed(2)
        );


        popView.avgHourText.text(
            stats.avgHour.toFixed(2)+
            "h"
        );


        popView.avgPayText.text(
            "¥"+
            stats.avgPay.toFixed(2)
        );


        // ----------------------------------------------------
        // V20.2：详细统计文字
        // ----------------------------------------------------

        let detailText="";


        if(arr.length===0){

            detailText =
                "暂无详细统计";

        }else{

            // 日均工时 / 日均工资已在统计卡片的大字体区域显示，
            // 这里不再重复显示。
            detailText = "";
        }


        // ----------------------------------------------------
        // V20.2：今年模式增加年度总结
        // ----------------------------------------------------

        if(
            currentFilter==="year" &&
            arr.length>0
        ){

            let yearSummary =
                calcYearSummary(
                    arr
                );


            detailText +=
                `\n\n========== 年度总结 ==========\n`+
                `有记录月份：${yearSummary.months.length} 个月\n`;


            if(
                yearSummary.months.length>0
            ){

                let monthAvgDays =
                    stats.days/
                    yearSummary.months.length;

                let monthAvgHour =
                    stats.hour/
                    yearSummary.months.length;

                let monthAvgPay =
                    stats.pay/
                    yearSummary.months.length;


                detailText +=
                    `月均出勤：${monthAvgDays.toFixed(2)} 天\n`+
                    `月均工时：${monthAvgHour.toFixed(2)}h\n`+
                    `月均工资：¥${monthAvgPay.toFixed(2)}\n`;
            }


            if(
                yearSummary.highestPayMonth
            ){

                detailText +=
                    `最高工资月份：`+
                    `${formatMonth(
                        yearSummary.highestPayMonth.month
                    )} `+
                    `¥${yearSummary.highestPayMonth.pay.toFixed(2)}\n`;
            }


            if(
                yearSummary.lowestPayMonth
            ){

                detailText +=
                    `最低工资月份：`+
                    `${formatMonth(
                        yearSummary.lowestPayMonth.month
                    )} `+
                    `¥${yearSummary.lowestPayMonth.pay.toFixed(2)}\n`;
            }


            if(
                yearSummary.highestHourMonth
            ){

                detailText +=
                    `最高工时月份：`+
                    `${formatMonth(
                        yearSummary.highestHourMonth.month
                    )} `+
                    `${yearSummary.highestHourMonth.hour.toFixed(2)}h\n`;
            }


            if(
                yearSummary.lowestHourMonth
            ){

                detailText +=
                    `最低工时月份：`+
                    `${formatMonth(
                        yearSummary.lowestHourMonth.month
                    )} `+
                    `${yearSummary.lowestHourMonth.hour.toFixed(2)}h`;
            }
        }


        popView.detailStatsText.text(
            detailText
        );


        // ----------------------------------------------------
        // 标题
        // ----------------------------------------------------

        let title =
            "考勤统计中心";


        if(
            currentFilter==="current"
        ){

            title =
                "本月考勤";
        }

        else if(
            currentFilter==="selectMonth"
        ){

            title =
                formatMonth(
                    selectedMonth
                )+
                "考勤";
        }

        else if(
            currentFilter==="year"
        ){

            title =
                currentYM.substring(
                    0,
                    4
                )+
                "年考勤";
        }


        popView.popTitle.text(
            title
        );


        // ----------------------------------------------------
        // 清空
        // ----------------------------------------------------

        popView.monthContainer
            .removeAllViews();


        // ----------------------------------------------------
        // 空状态
        // ----------------------------------------------------

        if(arr.length===0){

            let emptyView =
                ui.inflate(`
                <vertical
                    gravity="center"
                    padding="40">

                    <text
                        text="暂无考勤记录"
                        textSize="18sp"
                        gravity="center"/>

                    <text
                        text="当前筛选条件下没有记录"
                        textSize="14sp"
                        gravity="center"
                        margin="0 8 0 0"/>

                </vertical>
                `);


            popView.monthContainer
                .addView(
                    emptyView
                );


            return;
        }


        // ====================================================
        // 月份分组
        // ====================================================

        let group={};


        arr.forEach(r=>{

            if(!r.date){

                return;
            }


            let ym =
                r.date.substring(
                    0,
                    7
                );


            if(!group[ym]){

                group[ym]={

                    list:[],

                    count:0,

                    sumHour:0,

                    sumPay:0
                };
            }


            group[ym].list.push(
                r
            );


            group[ym].count++;


            group[ym].sumHour +=
                Number(
                    r.workHour
                )||0;


            group[ym].sumPay +=
                Number(
                    r.dayPay
                )||0;
        });


        let months =
            Object.keys(group)
                .sort()
                .reverse();


        // ====================================================
        // 创建月份
        // ====================================================

        months.forEach(ym=>{

            let g =
                group[ym];


            g.list.sort(
                (a,b)=>
                    new Date(b.date)-
                    new Date(a.date)
            );


            let expanded=false;


            if(
                currentFilter==="current" &&
                ym===currentYM
            ){

                expanded=true;
            }


            if(
                currentFilter==="selectMonth" &&
                ym===selectedMonth
            ){

                expanded=true;
            }


            if(
                currentFilter==="all" &&
                ym===currentYM
            ){

                expanded=true;
            }


            if(
                currentFilter==="year" &&
                ym===currentYM
            ){

                expanded=true;
            }


            let monthView =
                ui.inflate(`
                <vertical
                    margin="0 0 12 0">

                    <card
                        id="monthHeaderCard"
                        cardCornerRadius="10dp"
                        cardElevation="1dp">

                        <horizontal
                            padding="14 12"
                            gravity="center_vertical">

                            <vertical
                                layout_weight="1">

                                <text
                                    id="monthTitle"
                                    textSize="18sp"
                                    textStyle="bold"/>

                                <text
                                    id="monthSummary"
                                    textSize="13sp"
                                    margin="0 4 0 0"/>

                                <text
                                    id="monthDetail"
                                    textSize="12sp"
                                    margin="0 4 0 0"/>

                            </vertical>


                            <text
                                id="arrow"
                                textSize="22sp"
                                gravity="center"/>

                        </horizontal>

                    </card>


                    <vertical
                        id="dayContainer"
                        margin="8 0 0 0"/>

                </vertical>
                `);


            monthView.monthTitle.text(
                formatMonth(
                    ym
                )
            );


            monthView.monthSummary.text(
                `出勤 ${g.count} 天  · `+
                `工时 ${g.sumHour.toFixed(2)}h  · `+
                `工资 ¥${g.sumPay.toFixed(2)}`
            );


            monthView.monthDetail.text(
                getMonthDetailText(
                    g
                )
            );


            monthView.arrow.text(
                expanded
                ?
                "▼"
                :
                "▶"
            );


            // =================================================
            // 每日记录
            // =================================================

            g.list.forEach(o=>{

                let dayView =
                    ui.inflate(`
                    <card
                        margin="0 0 6 0"
                        cardCornerRadius="8dp"
                        cardElevation="1dp">

                        <vertical padding="12">

                            <horizontal
                                gravity="center_vertical">

                                <text
                                    id="dateText"
                                    textSize="17sp"
                                    textStyle="bold"
                                    layout_weight="1"/>

                                <text
                                    id="payText"
                                    textSize="17sp"
                                    textStyle="bold"
                                    gravity="right"/>

                            </horizontal>


                            <text
                                id="timeText"
                                textSize="14sp"
                                margin="0 5 0 0"/>


                            <horizontal>

                                <text
                                    id="restText"
                                    textSize="13sp"
                                    layout_weight="1"/>

                                <text
                                    id="workText"
                                    textSize="13sp"
                                    gravity="right"/>

                            </horizontal>

                        </vertical>

                    </card>
                    `);


                let md =
                    o.date.substring(
                        5
                    );


                let week =
                    getWeekDay(
                        o.date
                    );


                dayView.dateText.text(
                    `${md} ${week}`
                );


                dayView.payText.text(
                    "¥"+
                    Number(
                        o.dayPay||0
                    ).toFixed(2)
                );


                dayView.timeText.text(
                    `${o.clockIn}  →  ${o.clockOut}`
                );


                dayView.restText.text(
                    `休息 ${Number(
                        o.restHour||0
                    ).toFixed(2)}h`
                );


                dayView.workText.text(
                    `实际工时 ${Number(
                        o.workHour||0
                    ).toFixed(2)}h`
                );


                dayView.click(()=>{

                    showDayDetail(
                        o
                    );
                });


                monthView.dayContainer
                    .addView(
                        dayView
                    );
            });


            monthView.dayContainer.setVisibility(
                expanded
                ?
                android.view.View.VISIBLE
                :
                android.view.View.GONE
            );


            monthView.monthHeaderCard.click(()=>{

                let visible =
                    monthView.dayContainer
                        .getVisibility()===
                    android.view.View.VISIBLE;


                if(visible){

                    monthView.dayContainer
                        .setVisibility(
                            android.view.View.GONE
                        );


                    monthView.arrow.text(
                        "▶"
                    );

                }else{

                    monthView.dayContainer
                        .setVisibility(
                            android.view.View.VISIBLE
                        );


                    monthView.arrow.text(
                        "▼"
                    );
                }
            });


            popView.monthContainer
                .addView(
                    monthView
                );
        });
    }


    // ========================================================
    // 复制当前筛选
    // ========================================================

    function makeCopyText(){

        let arr =
            allArr.slice();


        if(
            currentFilter==="current"
        ){

            arr =
                arr.filter(r=>{

                    return (
                        r.date &&
                        r.date.substring(
                            0,
                            7
                        )===
                        currentYM
                    );
                });
        }


        if(
            currentFilter==="selectMonth"
        ){

            arr =
                arr.filter(r=>{

                    return (
                        r.date &&
                        r.date.substring(
                            0,
                            7
                        )===
                        selectedMonth
                    );
                });
        }


        if(
            currentFilter==="year"
        ){

            let year =
                currentYM.substring(
                    0,
                    4
                );


            arr =
                arr.filter(r=>{

                    return (
                        r.date &&
                        r.date.substring(
                            0,
                            4
                        )===
                        year
                    );
                });
        }


        arr.sort(
            (a,b)=>
                new Date(b.date)-
                new Date(a.date)
        );


        let stats =
            calcStats(
                arr
            );


        let title =
            "全部考勤记录";


        if(
            currentFilter==="current"
        ){

            title =
                "本月考勤记录";
        }

        else if(
            currentFilter==="selectMonth"
        ){

            title =
                formatMonth(
                    selectedMonth
                )+
                "考勤记录";
        }

        else if(
            currentFilter==="year"
        ){

            title =
                currentYM.substring(
                    0,
                    4
                )+
                "年考勤记录";
        }


        let s =
            `==== ${title} ====\n`;


        s +=
            `出勤：${stats.days}天\n`+
            `工时：${stats.hour.toFixed(2)}h\n`+
            `工资：${stats.pay.toFixed(2)}元\n`+
            `日均工时：${stats.avgHour.toFixed(2)}h\n`+
            `日均工资：${stats.avgPay.toFixed(2)}元\n`;


        // ----------------------------------------------------
        // 年度总结复制
        // ----------------------------------------------------

        if(
            currentFilter==="year"
        ){

            let ys =
                calcYearSummary(
                    arr
                );


            s +=
                `\n========== 年度总结 ==========\n`+
                `有记录月份：${ys.months.length}个月\n`;


            if(
                ys.months.length>0
            ){

                s +=
                    `月均出勤：`+
                    `${(
                        stats.days/
                        ys.months.length
                    ).toFixed(2)}天\n`+
                    `月均工时：`+
                    `${(
                        stats.hour/
                        ys.months.length
                    ).toFixed(2)}h\n`+
                    `月均工资：`+
                    `¥${(
                        stats.pay/
                        ys.months.length
                    ).toFixed(2)}\n`;
            }


            if(ys.highestPayMonth){

                s +=
                    `最高工资月份：`+
                    `${formatMonth(
                        ys.highestPayMonth.month
                    )} `+
                    `¥${ys.highestPayMonth.pay.toFixed(2)}\n`;
            }


            if(ys.lowestPayMonth){

                s +=
                    `最低工资月份：`+
                    `${formatMonth(
                        ys.lowestPayMonth.month
                    )} `+
                    `¥${ys.lowestPayMonth.pay.toFixed(2)}\n`;
            }


            if(ys.highestHourMonth){

                s +=
                    `最高工时月份：`+
                    `${formatMonth(
                        ys.highestHourMonth.month
                    )} `+
                    `${ys.highestHourMonth.hour.toFixed(2)}h\n`;
            }


            if(ys.lowestHourMonth){

                s +=
                    `最低工时月份：`+
                    `${formatMonth(
                        ys.lowestHourMonth.month
                    )} `+
                    `${ys.lowestHourMonth.hour.toFixed(2)}h\n`;
            }
        }


        if(arr.length===0){

            s+=
                "\n暂无记录";

            return s;
        }


        let group={};


        arr.forEach(r=>{

            let ym =
                r.date.substring(
                    0,
                    7
                );


            if(!group[ym]){

                group[ym]={

                    list:[],

                    count:0,

                    sumHour:0,

                    sumPay:0
                };
            }


            group[ym].list.push(
                r
            );


            group[ym].count++;


            group[ym].sumHour +=
                Number(
                    r.workHour
                )||0;


            group[ym].sumPay +=
                Number(
                    r.dayPay
                )||0;
        });


        let months =
            Object.keys(group)
                .sort()
                .reverse();


        months.forEach(ym=>{

            let g =
                group[ym];


            s +=
                `\n======== ${ym} ========\n`+
                `出勤：${g.count}天  `+
                `工时：${g.sumHour.toFixed(2)}h  `+
                `工资：${g.sumPay.toFixed(2)}元\n`;


            s +=
                getMonthDetailText(
                    g
                )+
                "\n";


            g.list.sort(
                (a,b)=>
                    new Date(b.date)-
                    new Date(a.date)
            );


            g.list.forEach(o=>{

                let md =
                    o.date.substring(
                        5
                    );


                s +=
                    `${md} ${getWeekDay(o.date)}｜`+
                    `${o.clockIn}-${o.clockOut}｜`+
                    `休息${Number(
                        o.restHour||0
                    ).toFixed(2)}h｜`+
                    `工时${Number(
                        o.workHour||0
                    ).toFixed(2)}h｜`+
                    `工资${Number(
                        o.dayPay||0
                    ).toFixed(2)}元\n`;
            });
        });


        return s;
    }


    // ========================================================
    // 显示统计弹窗
    // ========================================================

    let d =
        dialogs.build({
            customView:
                popView,
            cancelable:true
        }).show();


    // --------------------------------------------------------
    // 先渲染，再绑定点击事件
    // --------------------------------------------------------

    renderRecords();


    // ========================================================
    // 全部
    // ========================================================

    popView.filterAll.click(()=>{

        currentFilter =
            "all";

        renderRecords();
    });


    // ========================================================
    // 本月
    // ========================================================

    popView.filterCurrent.click(()=>{

        currentFilter =
            "current";


        selectedMonth =
            currentYM;


        renderRecords();
    });


    // ========================================================
    // 任意月份
    // ========================================================

    popView.filterSelect.click(()=>{

        let months =
            getAvailableMonths();


        if(months.length===0){

            toast(
                "暂无可选择的月份"
            );

            return;
        }


        let monthNames =
            months.map(
                ym=>
                    formatMonth(
                        ym
                    )
            );


        dialogs.select(
            "选择要查看的月份",
            monthNames,
            index=>{

                if(index<0){

                    return;
                }


                selectedMonth =
                    months[index];


                currentFilter =
                    "selectMonth";


                renderRecords();
            }
        );
    });


    // ========================================================
    // 今年
    // ========================================================

    popView.filterYear.click(()=>{

        currentFilter =
            "year";


        renderRecords();
    });


    // ========================================================
    // 复制
    // ========================================================

    popView.popCopy.click(()=>{

        copyText(
            makeCopyText()
        );
    });


    // ========================================================
    // 关闭
    // ========================================================

    popView.popClose.click(()=>{

        d.dismiss();
    });
});


// ============================================================
// 更多功能：低频数据功能集中到弹窗，不占用主界面
// ============================================================

ui.btnMoreFunctions.click(()=>{

    dialogs.select(
        "更多功能",
        [
            "导出 CSV",
            "导出 TXT",
            "备份记录",
            "导入备份",
            "删除备份"
        ],
        index=>{

            if(index===0){
                dialogs.confirm(
                    "确认导出",
                    "确认导出全部记录为CSV文件？",
                    ok=>{
                        if(ok) exportCsv();
                    }
                );
                return;
            }

            if(index===1){
                dialogs.confirm(
                    "确认导出",
                    "确认导出全部记录为TXT文本？",
                    ok=>{
                        if(ok) exportTxt();
                    }
                );
                return;
            }

            if(index===2){
                dialogs.confirm(
                    "确认备份",
                    "确认执行备份记录？相同数据不会重复生成备份文件",
                    ok=>{
                        if(ok) manualBackup();
                    }
                );
                return;
            }

            if(index===3){
                importBackup();
                return;
            }

            if(index===4){
                deleteBackupFiles();
            }
        }
    );
});


// ============================================================
// 导出 CSV
// ============================================================

ui.btnExportCsv.click(()=>{

    dialogs.confirm(
        "确认导出",
        "确认导出全部记录为CSV文件？",
        ok=>{

            if(!ok){

                return;
            }

            exportCsv();
        }
    );
});


// ============================================================
// 导出 TXT
// ============================================================

ui.btnExportTxt.click(()=>{

    dialogs.confirm(
        "确认导出",
        "确认导出全部记录为TXT文本？",
        ok=>{

            if(!ok){

                return;
            }

            exportTxt();
        }
    );
});


// ============================================================
// 备份
// ============================================================

ui.btnBak.click(()=>{

    dialogs.confirm(
        "确认备份",
        "确认执行备份记录？相同数据不会重复生成备份文件",
        ok=>{

            if(!ok){

                return;
            }

            manualBackup();
        }
    );
});


// ============================================================
// 恢复
// ============================================================

ui.btnRestore.click(
    importBackup
);


// ============================================================
// 删除备份
// ============================================================

ui.btnDelBackup.click(
    deleteBackupFiles
);