/* Final edition: investigation, testimony, and a private, playable epilogue. */
(() => {
  'use strict';
  const base = {
    runAction, addEvidence, inspectObject, startGame, triggerDialogue,
    advanceDialogue, renderGame, renderCourtRecord, renderEvidenceAcquisition,
    renderEnding, renderTitle, evidenceIcon, renderHotspots, openTalk, setScene
  };
  const fresh = () => ({
    edition: 2, deferredEvidence: [], afterEvidence: null, history: [],
    logOpen: false, placesOpen: false, restartPrompt: false, logicId: null,
    logicSelection: [], logicFeedback: '', hintLevel: 0, testimonyRound: 0,
    testimonyIndex: 0, testimonyPicker: false, testimonyFeedback: '',
    testimonyPressed: {}, exchangeChoice: null, exchangeConfirmed: false,
    exchangeReply: '', exchangeText: '', journalPage: -1, lastSpeaker: null, lastPose: 0
  });
  Object.assign(game, fresh());
  // Every physical exhibit is isolated on the same flat evidence surface.
  assets.evidenceAtlas = 'assets/33_evidence_atlas_clean.png';
  const cleanEvidenceImages = {
    invitation: assets.invitationEvidence,
    blackMask: assets.namelessMask,
    sealedName: assets.sealedName,
    namedMask: assets.namelessMask,
    repairLabel: 'assets/evidence-clean/repairLabel.png',
    visitorLedger: 'assets/evidence-clean/visitorLedger.png',
    cosplayCostume: 'assets/evidence-clean/cosplayCostume.png',
    backstagePhoto: 'assets/evidence-clean/backstagePhoto.png',
    harborKeyTag: 'assets/evidence-clean/harborKeyTag.png',
    doorKey: 'assets/evidence-clean/doorKey.png',
    recipeCard: 'assets/evidence-clean/recipeCard.png',
    kitchenTimer: 'assets/evidence-clean/kitchenTimer.png',
    spiceJar: 'assets/evidence-clean/spiceJar.png',
    cookingPhoto: 'assets/evidence-clean/cookingPhoto.png',
    travelTicket: 'assets/evidence-clean/travelTicket.png',
    kitchenKey: 'assets/evidence-clean/kitchenKey.png'
  };
  const cleanAtlasEvidence = new Set([
    'ownerLetter', 'starBadge', 'mirrorMark', 'candle', 'echoRecording',
    'echoKey', 'brokenRadio', 'tapedKnife', 'starButton', 'metalPin',
    'repairedRadio', 'collectionKey'
  ]);
  // Remove obsolete room crops, including those superseded by native records.
  Object.keys(evidenceVisuals).forEach(id => delete evidenceVisuals[id]);
  Object.entries(cleanEvidenceImages).forEach(([id, src]) => {
    evidenceVisuals[id] = [src, 'center', 'contain'];
  });
  scenes.entrance.objects.pen.x = 14;
  scenes.entrance.objects.pen.y = 86;
  investigationRegions['entrance:pen'] = [18, 12];
  scenes.entrance.objects.nameCards.x = 28;
  scenes.entrance.objects.nameCards.y = 80;
  investigationRegions['entrance:nameCards'] = [23, 15];
  scenes.ballroom.objects.letter.x = 51;
  scenes.ballroom.objects.letter.y = 54;
  scenes.ballroom.objects.host.x = 77;
  const html = value => escapeAttribute(String(value ?? '')).replaceAll("'", '&#39;');
  const memoryIds = ['freedomCard', 'collectionCard', 'imaginaryCard', 'tableCard'];
  const memoryNames = ['属于自己的下午', '舍不得的东西', '借来的勇气', '想留的位置'];
  const memoryMarks = ['烛', '藏', '门', '席'];
  const modes = new Set(['title','dialogue','investigate','alias','hook','chapter','talk','present','deduction','invitationOpen','attendanceChoice','declined','collectionUnlock','ending','evidencePause','logic','testimony','exchange','journal']);
  let typingTimer = null;
  let inputSaveTimer = null;
  let typingKey = '';
  let typingComplete = true;
  let imageSizes = new Map();
  let lastMountedLine = '';

  // New edition saves separately; the previous edition's save is retained.
  saveGame = function(showMessage) {
    if (game.mode === 'title' || game.mode === 'declined') return false;
    try {
      const snapshot = JSON.parse(JSON.stringify(game));
      snapshot.systemMessage = '';
      snapshot.logOpen = false;
      snapshot.placesOpen = false;
      snapshot.chapterMapOpen = false;
      snapshot.restartPrompt = false;
      snapshot.history = (snapshot.history || []).slice(-180);
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
      if (showMessage) showSystemMessage('已经保存。下次从这一刻继续。');
      return true;
    } catch (error) {
      if (showMessage) showSystemMessage('浏览器暂时无法保存；请先不要关闭页面。');
      return false;
    }
  };
  function validSave(saved) {
    return saved && saved.edition === 2 && scenes[saved.scene] && modes.has(saved.mode)
      && Array.isArray(saved.evidence) && saved.evidence.every(id => evidenceCatalog[id])
      && Array.isArray(saved.dialogue) && saved.dialogue.every(line => Array.isArray(line) && typeof line[0] === 'string' && typeof line[1] === 'string')
      && saved.flags && typeof saved.flags === 'object' && saved.inspected && typeof saved.inspected === 'object'
      && saved.talked && typeof saved.talked === 'object' && saved.presented && typeof saved.presented === 'object'
      && typeof saved.alias === 'string' && saved.hookAnswers && typeof saved.hookAnswers === 'object';
  }
  hasSavedGame = function() {
    try { return Boolean(validSave(JSON.parse(localStorage.getItem(SAVE_KEY)))); }
    catch (_) { return false; }
  };
  continueGame = function() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!validSave(saved)) throw new Error('Invalid save');
      Object.assign(game, fresh(), saved, { logOpen: false, placesOpen: false, evidenceOpen: false, chapterMapOpen: false, systemMessage: '', restartPrompt: false });
      game.dialogueIndex = Math.max(0, Math.min(Number(game.dialogueIndex) || 0, Math.max(0, game.dialogue.length - 1)));
      game.evidenceNoticeQueue = (game.evidenceNoticeQueue || []).filter(id => evidenceCatalog[id]);
      game.deferredEvidence = (game.deferredEvidence || []).filter(id => evidenceCatalog[id]);
      typingKey = '';
      render();
    } catch (_) { showSystemMessage('这份进度无法读取。可以从请柬重新开始。'); }
  };
  startGame = function() {
    Object.assign(game, fresh());
    typingKey = '';
    lastMountedLine = '';
    base.startGame();
  };
  returnToTitle = function() {
    saveGame(false);
    game.mode = 'title';
    game.logOpen = game.evidenceOpen = game.placesOpen = game.chapterMapOpen = false;
    render();
  };
  // Discovery is narrated before its evidence card appears.
  addEvidence = function(ids) {
    const existingQueue = game.evidenceNoticeQueue.slice();
    const added = base.addEvidence(ids);
    const newlyQueued = game.evidenceNoticeQueue.filter(id => !existingQueue.includes(id));
    game.evidenceNoticeQueue = existingQueue;
    game.deferredEvidence = [...new Set([...(game.deferredEvidence || []), ...newlyQueued])];
    return added;
  };
  function noteCurrentLine() {
    if (game.mode !== 'dialogue') return;
    const line = game.dialogue[game.dialogueIndex];
    if (!line) return;
    const key = game.scene + ':' + game.dialogueIndex + ':' + line.join('|');
    if (key === lastMountedLine) return;
    lastMountedLine = key;
    game.history.push({ speaker: line[0] === '玩家' ? (game.alias || '你') : line[0], text: line[1], scene: sceneState().title });
    game.history = game.history.slice(-180);
    if (speakerArt[line[0]] || line[0] === '拾一') {
      game.lastSpeaker = line[0];
      game.lastPose = poseIndexFor(line[0], line[1]);
    }
  }
  triggerDialogue = function(lines, after) {
    game.placesOpen = false;
    base.triggerDialogue(lines, after);
  };
  advanceDialogue = function() {
    if (game.mode !== 'dialogue') return;
    if (!typingComplete) { finishTyping(); return; }
    if (game.dialogueIndex < game.dialogue.length - 1) {
      base.advanceDialogue();
      return;
    }
    const action = game.afterDialogue || 'investigate';
    if (game.deferredEvidence.length) {
      game.evidenceNoticeQueue.push(...game.deferredEvidence);
      game.deferredEvidence = [];
      game.afterEvidence = action;
      game.mode = 'evidencePause';
      render();
    } else runAction(action);
  };
  function dismissEvidence() {
    if (!game.evidenceNoticeQueue.length) return;
    game.evidenceNoticeQueue.shift();
    if (!game.evidenceNoticeQueue.length && game.afterEvidence) {
      const action = game.afterEvidence;
      game.afterEvidence = null;
      runAction(action);
    } else render();
  }
  inspectObject = function(key) {
    game.placesOpen = false;
    if (game.scene === 'collection' && key === 'drawer' && game.flags.hook2 && !game.flags.collectionDrawerOpened) {
      runAction('collectionUnlock');
      return;
    }
    if (sceneInspected(key)) {
      const item = sceneState().objects[key];
      const ids = Array.isArray(item?.evidence) ? item.evidence : [item?.evidence];
      const found = ids.find(id => game.evidence.includes(id));
      if (found) { game.evidenceSelected = found; game.evidenceOpen = true; render(); }
      else showSystemMessage('已经调查过这里。可以在「回看」中重读对话。');
      return;
    }
    base.inspectObject(key);
  };

  const logicCases = {
    mirror: { title: '让光走到录音机', question: '哪两件证物分别告诉你光路的起点和排列顺序？', ids: ['mirrorMark','candle'], action: 'reveal-mirror-light', flag: 'mirrorLightRevealed', scene: 'echo', hint: '一件在镜框上，另一件的底座有图。' },
    repair: { title: '让收音机重新工作', question: '选出待修的物品、打开后盖的工具，以及能替代缺件的零件。', ids: ['brokenRadio','tapedKnife','metalPin'], action: 'repair-radio', flag: 'repaired', scene: 'collection', hint: '后盖需要拧开，连杆还少一根销。纽扣不能代替金属销。' },
    melody: { title: '声音来自哪里', question: '比较三年前留下的声音，和你刚刚恢复的声源。', ids: ['echoRecording','repairedRadio'], action: 'compare-melody', flag: 'melodyMatched', scene: 'collection', hint: '先让收音机恢复工作，再拿录音中的哼唱来听。' },
    costume: { title: '寻找纽扣原来的位置', question: '哪两件实物能通过残片、断线和缺口进行直接比对？', ids: ['starButton','cosplayCostume'], action: 'match-costume', flag: 'costumeMatched', scene: 'anyHouse', hint: '照片只能告诉你谁穿过衣服。要拼合缺口，必须拿出实物。' },
    handwriting: { title: '三份文字，一条来路', question: '选出分别来自收藏室、任意屋和厨房的三份手写原件。', ids: ['repairLabel','visitorLedger','recipeCard'], action: 'compare-handwriting', flag: 'handwritingMatched', scene: 'kitchen', hint: '维修人留下的字、访客登记、反复修改的菜谱。' }
  };
  const logicAction = {
    'reveal-mirror-light': () => revealMirrorLight(), 'repair-radio': () => repairRadio(),
    'compare-melody': () => compareMelody(), 'match-costume': () => matchCostume(),
    'compare-handwriting': () => compareHandwriting()
  };
  function readyLogic() {
    return Object.entries(logicCases).filter(([, item]) => item.scene === game.scene && !game.flags[item.flag]
      && item.ids.every(id => game.evidence.includes(id)));
  }
  function openLogic(id) {
    const item = logicCases[id];
    if (!item || !readyLogic().some(([key]) => key === id)) return;
    game.logicId = id;
    game.logicSelection = [];
    game.logicFeedback = '';
    game.evidenceOpen = false;
    game.mode = 'logic';
    render();
  }
  function confirmLogic() {
    const item = logicCases[game.logicId];
    if (!item || game.logicSelection.length !== item.ids.length) return;
    if (item.ids.every(id => game.logicSelection.includes(id))) {
      game.logicFeedback = '';
      playSfx('unlock');
      logicAction[item.action]();
    } else {
      game.logicFeedback = '这组证物还不能完成这项检查。' + item.hint;
      playSfx('wrong');
      render();
    }
  }
  renderAssociations = function() {
    const ready = readyLogic();
    return '<div class="association-zone"><h3>线索对照</h3>' + (ready.length
      ? ready.map(([id, item]) => '<button class="association-button" data-action="open-logic" data-logic="' + id + '">' + item.title + '<span>选择证物 ›</span></button>').join('')
      : '<p>先观察物件、听完证词。有可以核对的线索时，会在这里记下一项检查。</p>') + '</div>';
  };
  function renderLogic() {
    if (game.mode !== 'logic') return '';
    const item = logicCases[game.logicId];
    if (!item) return '';
    const choices = game.evidence.filter(id => !memoryIds.includes(id) && !id.endsWith('Key') && id !== 'sealedName');
    return '<div class="modal-backdrop"><section class="logic-board" role="dialog" aria-modal="true" aria-label="线索对照"><header><small>线索对照</small><h2>' + item.title + '</h2></header><p class="logic-question">' + item.question + '</p>' +
      '<div class="logic-slots">已选 ' + game.logicSelection.length + ' / ' + item.ids.length + '：' + (game.logicSelection.map(id => evidenceCatalog[id][0]).join(' ＋ ') || '点击下方证物放入对照') + '</div>' +
      '<div class="logic-evidence">' + choices.map(id => '<button class="present-evidence' + (game.logicSelection.includes(id) ? ' is-selected' : '') + '" data-action="logic-select" data-evidence="' + id + '" aria-pressed="' + game.logicSelection.includes(id) + '">' + evidenceIcon(id) + '<strong>' + evidenceCatalog[id][0] + '</strong></button>').join('') + '</div>' +
      '<p class="logic-feedback" role="status">' + html(game.logicFeedback || '可以再次点击，移除已选证物。') + '</p><footer><button class="talk-close" data-action="logic-cancel">返回调查</button><button class="story-primary-button" data-action="logic-confirm"' + (game.logicSelection.length === item.ids.length ? '' : ' disabled') + '>进行对照</button></footer></section></div>';
  }

  const testimony = [
    { title: '谁留下了声音', statements: [
      '管理员腰间有黄铜总钥匙。录音里，也有钥匙相撞的声音。',
      '他能接上那段旋律。因此，录下哼唱的人只可能是他。',
      '但一个姓氏和一串钥匙，还不是完整的身份。'
    ], press: [
      '三年前志愿者轮流借用总钥匙。这一点已经向管理员核实。',
      '“会唱”与“只有他会唱”之间，还缺一个条件。想想这首曲子原本在哪里播放。',
      '名字残片能帮助查档，却不能直接认人。先检验前一句中的“只可能”。'
    ], index: 1, evidence: ['sameMelody'], after: [
      ['玩家','等一下。旋律对照说明，它是礼堂的闭馆广播。每位志愿者都听得到。'],
      ['管理员','对。我会唱，狐狸客也会。钥匙也不是我独用的。'],
      ['玩家','所以这些线索不能单独指认你。它们把录音带回了三年前的礼堂。'],
      ['影子','好。那件衣服，又该算谁的？']
    ] },
    { title: '谁站在镜头之外', statements: [
      '后台照片里，狐狸面具客穿着那套衣服。',
      '既然她是穿衣服的人，替衣服缝过这枚纽扣的人也一定是她。',
      '如果只是相似的图案，仍不足以把两个房间连起来。'
    ], press: [
      '照片证明了穿着者。画面边缘还留下了另一只正在缝补的手。',
      '穿着、制作、修理，是三种不同的关系。仔细看照片，谁穿着衣服，谁正在缝补？',
      '这句话本身成立。断角拼合已经确认了衣物来源，但我们还要分清：谁穿过，谁修过。'
    ], index: 1, evidence: ['backstagePhoto'], after: [
      ['玩家','穿衣服的人不等于修理者。照片边缘，是另一个人在替她缝补。'],
      ['玩家','纽扣缺角与肩缝残片拼合，证明物品确实来过两个房间。照片进一步说明，穿着者与修补者并不是同一个人。'],
      ['狐狸面具客','我只喊了一次，又说散场再补拍。后来也没去找他。'],
      ['影子','你已经排除了两次草率的指认。现在，凭什么指向你自己？']
    ] },
    { title: '回答，还是证据', statements: [
      '修理标签、登记簿和菜谱，把这些旧物连到了同一份寄存记录。',
      '可是请柬能转交，物品也能借用。持有它们，不等于就是三年前的失主。',
      '你回答了四个问题。除此以外，再没有独立的材料可以核验旧失主。'
    ], press: [
      '四个房间证明的是旧物的来路；要找到人，还需要能连接过去与今晚的材料。',
      '这次质疑是成立的。不要用“只有我收到请柬”当作结论。',
      '行李箱里的寄存存根，在你回答问题之前就已经存在。它记下了旧包的编号和核验方法。'
    ], index: 2, evidence: ['archiveReceipt'], after: [
      ['玩家','还有三年前的寄存存根。它能找到从未拆封的旧包，封口保留着原寄存者的指印。'],
      ['主持人','旧身份档袋在这里。封条、编号都能与存根对上。门卫，请共同核对。'],
      ['门卫','封条完整，未见揭起。请再拿出今晚登记时留下的核验凭条。'],
      ['拾一','现在比的是两个时间点的印迹。和你刚才愿意写下什么，无关。']
    ] }
  ];
  function startTestimony() {
    game.mode = 'testimony';
    game.testimonyPicker = false;
    game.testimonyFeedback = '';
    game.evidenceOpen = false;
    game.lastSpeaker = '影子';
    render();
  }
  function submitTestimony(id) {
    if (!game.evidence.includes(id)) return;
    const round = game.testimonyRound;
    if (round === 3) {
      if (id !== 'currentImprint') {
        game.testimonyFeedback = '需要今晚登记当场留下的凭条，不能用新写的记忆卡代替。';
        playSfx('wrong'); render(); return;
      }
      game.testimonyPicker = false;
      game.flags.identityVerified = true;
      base.runAction('proveMemories');
      return;
    }
    const item = testimony[round];
    if (!item || game.testimonyIndex !== item.index || !item.evidence.includes(id)) {
      game.testimonyFeedback = round === 1 && id === 'costumeMatch'
        ? '纽扣已经证明衣物来源，却不能证明谁在缝补。要分清穿衣者与修补者，请再查看后台照片。'
        : '这件证物没有推翻当前这句话。先「追问」把主张说清楚，再选择与它冲突的证物。';
      game.testimonyPicker = false;
      playSfx('wrong'); render(); return;
    }
    playSfx('impact');
    game.testimonyPicker = false;
    triggerDialogue(item.after, 'nextTestimony');
  }
  function renderTestimony() {
    if (game.mode !== 'testimony') return '';
    const round = game.testimonyRound;
    const item = testimony[round];
    const index = game.testimonyIndex;
    const title = round === 3 ? '最后核验 · 过去与今晚' : item.title;
    const statement = round === 3 ? '旧封条已经核对。请出示今晚登记时，由你亲手留下的核验凭条。' : item.statements[index];
    const candidates = game.evidence.filter(id => !memoryIds.includes(id) && !id.endsWith('Key'));
    return '<section class="testimony-panel" aria-label="证言复核"><div class="testimony-heading"><small>' + (round === 3 ? '封印核验' : '证言复核 · ' + (round + 1) + ' / 3') + '</small><h2>' + title + '</h2><span>影子 · 守门人的质询</span></div>' +
      '<p class="testimony-statement">“' + formatDialogue(statement) + '”</p>' +
      '<div class="testimony-controls">' + (round < 3 ? '<button data-action="testimony-prev" aria-label="上一句">‹ 上一句</button><span>' + (index + 1) + ' / ' + item.statements.length + '</span><button data-action="testimony-next">下一句 ›</button><button data-action="testimony-press">追问</button>' : '') + '<button class="story-primary-button" data-action="testimony-present">出示证物</button></div><p class="logic-feedback" role="status">' + html(game.testimonyFeedback || '逐句检查：可以追问，再用证物反驳具体的一句话。出示错误可以重试。') + '</p></section>' +
      (game.testimonyPicker ? '<div class="modal-backdrop"><section class="testimony-picker" role="dialog" aria-modal="true" aria-label="选择反证"><header><h2>对这句话出示证物</h2><p>“' + html(statement) + '”</p></header><div class="presentation-grid">' + candidates.map(id => '<button class="present-evidence" data-action="testimony-evidence" data-evidence="' + id + '">' + evidenceIcon(id) + '<strong>' + evidenceCatalog[id][0] + '</strong></button>').join('') + '</div><p class="logic-feedback">' + html(game.testimonyFeedback) + '</p><button class="talk-close" data-action="testimony-cancel">返回证言</button></section></div>' : '');
  }

  function renderExchange() {
    if (game.mode !== 'exchange') return '';
    return '<div class="modal-backdrop"><section class="exchange-panel" role="dialog" aria-modal="true" aria-label="选择愿意分享的记忆"><small>终幕 · 留一个位置</small><h2>有哪一页，你愿意让她读到？</h2><p>狐狸面具客把自己的卡片放在桌上。你可以选一张，也可以把四张都留给自己。</p><div class="memory-choices">' + memoryNames.map((name, i) => '<button class="memory-choice' + (game.exchangeChoice === String(i+1) ? ' is-selected' : '') + '" data-action="select-memory" data-memory="' + (i+1) + '" aria-pressed="' + (game.exchangeChoice === String(i+1)) + '"><span class="memory-choice-mark">' + memoryMarks[i] + '</span><strong>' + name + '</strong><span>' + html(game.hookAnswers[i+1] || '这段话暂时留白。') + '</span></button>').join('') + '</div><button class="memory-private' + (game.exchangeChoice === 'private' ? ' is-selected' : '') + '" data-action="select-memory" data-memory="private" aria-pressed="' + (game.exchangeChoice === 'private') + '">这一夜，我想先把它们留给自己</button>' + (game.exchangeChoice && game.exchangeChoice !== 'private' ? '<label class="exchange-edit">只给对方的那句话 · 可以改写，原卡仍为你保留<textarea data-exchange-input maxlength="1600">' + html(game.exchangeText) + '</textarea></label>' : '') + '<footer><span>这是与故事角色的交流；你的文字只保存在当前浏览器。</span><button class="exchange-confirm story-primary-button" data-action="confirm-exchange"' + (game.exchangeChoice === 'private' || game.exchangeChoice && game.exchangeText.trim() ? '' : ' disabled') + '>' + (game.exchangeChoice === 'private' ? '确认保留' : '确认这张卡') + '</button></footer></section></div>';
  }
  function confirmExchange() {
    if (!['1','2','3','4','private'].includes(game.exchangeChoice) || game.exchangeChoice !== 'private' && !game.exchangeText.trim()) return;
    game.exchangeConfirmed = true;
    const replies = {
      '1': '下次我找你，先问你下午有没有自己的安排。',
      '2': '那件演出服我一直留着。肩上的针脚还在，我不会再把别人花的时间当成理所当然。',
      '3': '以前我以为穿上英雄的衣服，就不能害怕。现在我想，害怕的时候也可以喊人帮忙。',
      '4': '下次拍照，我会先把你的位置留出来。菜凉了再热，人不要一直站在镜头外。'
    };
    game.exchangeReply = replies[game.exchangeChoice] || '那就先留着。我把我的那一张放在这里，你想读的时候再读。';
    triggerDialogue(game.exchangeChoice === 'private' ? [
      ['玩家','我想先自己保管。不是不信你，是还没想好怎么说。'],
      ['狐狸面具客','知道了。你不用为了让我高兴，把自己交出来。'],
      ['旁白','她收起伸出的手，把自己的卡片轻轻推到桌边。'],
      ['狐狸面具客',game.exchangeReply],
      ['玩家','谢谢。这次，我会记得来拿。']
    ] : [
      ['旁白','你选出“' + memoryNames[Number(game.exchangeChoice)-1] + '”的副本。四张原卡，仍收在自己的信封里。'],
      ['狐狸面具客','我只读这一张。'],
      ['旁白','她读完，没有替你解释，只把自己的卡片推了过来。'],
      ['狐狸面具客',game.exchangeReply],
      ['玩家','那下次，记得叫上我。']
    ], 'goEpilogue');
  }
  function journalPages() {
    const alias = game.alias || '无名旅人';
    return [
      { title: '写给日出以后的你', mark: '序', body: alias + '：\n你取回了名字，也取回了替自己作答的权利。三年前的旧物证明你曾经来过；今晚写下的这些话，记录你现在站在哪里。\n这本手札不替你下结论。以后变了主意，也可以。' },
      { title: '案件已经结束', mark: '证', body: '九面镜的路线带我们听到录音。收音机、纽扣和三份手稿，把四个房间连回同一份寄存记录。\n最后，旧身份档袋的完整封条、三年前的指印，与今晚留下的凭条完成核验。\n共鸣锁没有鉴定身份。它只是把此刻的回答，好好留下。' },
      ...memoryNames.map((title,i) => ({ title, mark: memoryMarks[i], body: game.hookAnswers[i+1] || '这一页暂时留白。它仍然属于你。', personal: true })),
      { title: game.exchangeChoice === 'private' ? '留给自己的边界' : '桌子另一边的回信', mark: '信', body: (game.exchangeChoice === 'private' ? '你选择了暂时保留全部记忆。这个选择被尊重了。' : '你分享了“' + memoryNames[Number(game.exchangeChoice)-1] + '”的副本。四张原卡仍由你自己保管。\n你愿意让她读到的是：\n“' + game.exchangeText + '”') + '\n\n她留给你的话：\n“' + (game.exchangeReply || '下次拍照，记得站过来。') + '”' },
      { title: '下一页，留给明天', mark: '续', body: '临走时，管理员把收音机的音量调低。狐狸客站在门边，真的替你留了一个位置。拾一趴在信封上，睡着以前只说了一句：\n“下次想起什么，别等三年。”\n\n封印姓名的我们，会失去什么？\n失去束缚，获得新生。' }
    ];
  }
  function renderJournal() {
    if (game.mode !== 'journal') return '';
    const pages = journalPages();
    const spread = game.journalPage;
    const book = spread < 0
      ? '<button class="journal-cover" data-action="journal-open" aria-label="打开我的记忆手札"><span>✦</span><small>失名之夜 · 私人藏本</small><h1>我是谁</h1><p>初稿</p><span class="journal-owner">' + html(game.alias || '无名旅人') + ' 的手札</span><strong>打开手札 ›</strong></button>'
      : '<div class="journal-spread" key="' + spread + '">' + pages.slice(spread*2,spread*2+2).map((page,i) => '<article class="journal-page' + (page.personal ? ' personal-page' : '') + '"><small>' + page.mark + ' · 失名之夜</small><h2>' + page.title + '</h2><div class="journal-prose">' + html(page.body).replaceAll('\n','<br>') + '</div><span class="journal-page-number">' + String(spread*2+i+1).padStart(2,'0') + '</span></article>').join('') + '</div>';
    return '<div class="journal-backdrop"><section class="journal-book" aria-label="我的记忆手札">' + book + (spread >= 0 ? '<nav class="journal-nav" aria-label="翻页"><button data-action="journal-prev">‹ 上一页</button><span>' + (spread+1) + ' / 4</span>' + (spread < 3 ? '<button data-action="journal-next">下一页 ›</button>' : '<button data-action="journal-finish">合上手札 · 完</button>') + '</nav>' : '') + '<div class="journal-actions"><span>这些文字只属于你，保存在当前浏览器。</span><button data-action="download-journal">保存我的手札</button>' + (game.flags.storyFinished ? '<button data-action="journal-finish">返回结尾</button>' : '') + '</div></section></div>';
  }
  function downloadJournal() {
    const body = journalPages().map(page => '<article><small>面具之下 · 私人手札</small><h2>' + html(page.title) + '</h2><p>' + html(page.body).replaceAll('\n','<br>') + '</p></article>').join('');
    const doc = '<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + html(game.alias || '无名旅人') + '的记忆手札</title><style>body{margin:auto;max-width:760px;padding:50px 24px;background:#efe5cf;color:#332b23;font:18px/1.9 Georgia,"Songti SC",serif}h1,h2{font-weight:500}small{letter-spacing:.2em;color:#836641}article{padding:32px 0;border-top:1px solid #ad9570;break-inside:avoid}p{overflow-wrap:anywhere}footer{font-size:13px}@media print{body{background:white;padding:0}article{break-after:page}}</style><h1>我是谁 · 初稿</h1><p>' + html(game.alias || '无名旅人') + ' 的记忆手札</p>' + body + '<footer>《面具之下：失名之夜》 · 此文件由你的浏览器在本地生成，未上传任何回答。</footer></html>';
    const url = URL.createObjectURL(new Blob([doc],{type:'text/html;charset=utf-8'}));
    const a = document.createElement('a'); a.href = url; a.download = '面具之下-我的记忆手札.html'; a.click();
    setTimeout(() => URL.revokeObjectURL(url),10000);
    showSystemMessage('手札已生成，可以离线阅读或打印。');
  }

  // Evidence diagrams are code-native records; no personal biometric data is collected.
  function printDrawing() {
    return '<svg viewBox="0 0 120 110" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M22 81C6 15 114 6 99 83M29 87C13 25 105 16 93 89M36 91C20 35 97 25 86 92M43 94C28 44 88 35 79 96M51 96C38 49 80 43 73 96M58 87C48 56 72 51 67 87M16 55L25 61M95 48L103 54M39 32L42 40"/><circle cx="26" cy="62" r="5"/><circle cx="95" cy="51" r="5"/><circle cx="43" cy="40" r="5"/></svg>';
  }
  function recordDrawing(title, drawing, caption) {
    return '<svg class="evidence-record-drawing" viewBox="0 0 220 220" aria-hidden="true"><rect class="record-paper" x="9" y="9" width="202" height="202" rx="2"/><text class="record-heading" x="110" y="33">' + title + '</text>' + drawing + '<text class="record-caption" x="110" y="196">' + caption + '</text></svg>';
  }
  function derivedEvidenceDrawing(id) {
    if (id === 'sameMelody') {
      const waveform = 'M50 0h9l3-6 3 12 3-6h9l3-13 3 26 3-13h9l3-9 3 18 3-9h9l3-18 3 36 3-18h9l3-13 3 26 3-13h9l3-6 3 12 3-6h12';
      const rows = [['录音哼唱',87],['闭馆广播',151]].map(([label,y]) => '<text class="record-page-label" x="110" y="' + (y-24) + '">' + label + '</text><path class="record-route" d="' + waveform + '" transform="translate(0 ' + y + ')"/>').join('');
      return recordDrawing('闭馆曲对照记录', rows, '共同来源 ≠ 身份证明');
    }
    if (id === 'mirrorLightPath') {
      const points = [[44,63],[110,63],[176,63],[176,106],[110,106],[44,106],[44,149],[110,149],[176,149]];
      const mirrors = points.map(([x,y],i) => '<g><rect class="record-mirror" x="' + (x-13) + '" y="' + (y-14) + '" width="26" height="28" rx="3"/><path class="record-line" d="M' + (x-7) + ' ' + (y+7) + 'l14-14"/><text class="record-number" x="' + x + '" y="' + (y+26) + '">' + (i+1) + '</text></g>').join('');
      return recordDrawing('九面镜光路', '<path class="record-route" d="M22 63H176V106H44V149H196"/>' + mirrors + '<path class="record-line" d="M191 139v20m8-20v20"/>', '镜面顺序 → 感光口');
    }
    if (id === 'handwritingMatch') {
      const pages = ['维修标签','角色手札','手写菜谱'].map((label,i) => {
        const x = 25 + i*59;
        return '<g><rect class="record-paper" x="' + x + '" y="61" width="51" height="77" rx="2"/><path class="record-line" d="M' + (x+9) + ' 83h30m-30 12h26m-26 12h30m-30 12q8-7 14 0t15-3"/><text class="record-page-label" x="' + (x+25.5) + '" y="153">' + label + '</text></g>';
      }).join('');
      return recordDrawing('四房移交链', pages + '<path class="record-route" d="M41 170H179m-7-5 7 5-7 5"/>', '笔迹 · 连续页码 · 寄存记录');
    }
    if (id === 'costumeMatch') {
      return recordDrawing('纽扣断角拼合', '<circle class="record-button" cx="82" cy="107" r="40"/><path class="record-star" d="M82 73 91 98 101 102 105 112 91 117 82 141 72 117 49 107 72 98Z"/><path class="record-fragment" d="M124 89 147 100 125 109 121 100Z"/><path class="record-route" d="M119 107H107m5-4-5 4 5 4"/><path class="record-line" d="M162 63l-7 13 9 10-9 12 9 11-9 12 9 11-9 12 7 13m13-94v94"/><text class="record-page-label" x="79" y="165">纽扣缺角</text><text class="record-page-label" x="161" y="174">肩缝残片</text>', '断口与残片相合');
    }
    if (id === 'fourMemories') {
      const cards = [['烛',41,54],['藏',118,54],['门',41,116],['席',118,116]].map(([mark,x,y]) => '<g><rect class="record-paper" x="' + x + '" y="' + y + '" width="61" height="51" rx="3"/><text class="record-memory-mark" x="' + (x+30.5) + '" y="' + (y+33) + '">' + mark + '</text></g>').join('');
      return recordDrawing('四张记忆卡', cards, '今晚留下的四个回答');
    }
    return '';
  }
  evidenceIcon = function(id, extraClass) {
    const cls = 'evidence-icon ' + (extraClass || '');
    const attrs = ' data-evidence-id="' + html(id) + '" role="img" aria-label="' + html(evidenceCatalog[id]?.[0] || id) + '图片"';
    if (['currentImprint','archiveReceipt','identityMatch'].includes(id)) {
      const old = id === 'archiveReceipt';
      return '<div class="' + cls + ' document-evidence"' + attrs + '><small>' + (old ? '三年前 · 旧存根' : id === 'identityMatch' ? '新旧封印核验' : '今夜 · 登记凭条') + '</small>' + printDrawing() + '<strong>' + (old ? '旧印留存' : id === 'identityMatch' ? '核验相合' : '当场留印') + '</strong><span>第十一号寄存 · 核验凭据</span></div>';
    }
    const memory = memoryIds.indexOf(id);
    if (memory >= 0) return '<div class="' + cls + ' memory-evidence memory-' + memory + '"' + attrs + '><small>今夜留下的一页</small><span>' + memoryMarks[memory] + '</span><strong>' + memoryNames[memory] + '</strong><i>✦</i></div>';
    const drawing = derivedEvidenceDrawing(id);
    if (drawing) return '<div class="' + cls + ' native-record-evidence"' + attrs + '>' + drawing + '</div>';
    if (cleanEvidenceImages[id]) return '<div class="' + cls + ' isolated-evidence"' + attrs + '><img class="evidence-art" src="' + html(cleanEvidenceImages[id]) + '" alt="" draggable="false"></div>';
    if (cleanAtlasEvidence.has(id)) {
      // Five columns and four rows; the last row's artwork begins above its
      // nominal grid edge, so share the observed clear separator at y=810.
      // This preserves the full key and excludes its cap from the button cell.
      const index = evidenceAtlasIndex[id];
      const cellWidth = 1402 / 5;
      const row = Math.floor(index/5);
      const rowEdges = [0, 280.5, 561, 810, 1122];
      const cellHeight = rowEdges[row+1] - rowEdges[row];
      const x = (index % 5)*cellWidth;
      const y = rowEdges[row];
      const viewBox = [x, y, cellWidth, cellHeight].join(' ');
      // A nested viewport also clips the empty margins introduced by contain.
      return '<div class="' + cls + ' isolated-evidence atlas-evidence"' + attrs + '><svg class="evidence-art" viewBox="' + viewBox + '" aria-hidden="true"><svg x="' + x + '" y="' + y + '" width="' + cellWidth + '" height="' + cellHeight + '" viewBox="' + viewBox + '" overflow="hidden"><image href="' + assets.evidenceAtlas + '" width="1402" height="1122"/></svg></svg></div>';
    }
    return '<div class="' + cls + ' native-record-evidence"' + attrs + '>' + recordDrawing(html(evidenceCatalog[id]?.[0] || id), '', '证物记录') + '</div>';
  };
  renderCourtRecord = function() {
    let result = base.renderCourtRecord();
    const id = selectedEvidenceId();
    const m = memoryIds.indexOf(id);
    if (m >= 0) result = result.replace('</div><div class="association-zone">','</div><blockquote class="personal-evidence">' + html(game.hookAnswers[m+1] || '这一页暂时留白。') + '</blockquote><div class="association-zone">');
    return result.replace('>返回调查</button>','>返回</button>');
  };
  renderEvidenceAcquisition = function() {
    return base.renderEvidenceAcquisition().replace('点击底部任意位置，或按 Enter / 空格继续','点击继续 · Enter / 空格也可收起');
  };
  renderHook = function() {
    if (game.mode !== 'hook') return '';
    const questions = [
      ['一个没有安排的下午','接下来三四个小时完全属于你。你会先去哪里、做什么？可以从一件很小的事写起。'],
      ['一件舍不得丢的东西','你留下过什么不起眼的东西？它在哪里，你为什么还记得它？'],
      ['一位想象中的同行者','哪位书中、电影或游戏里的角色陪伴过你？想起他时，你最先想到哪个片刻？'],
      ['想留给谁的位置','如果能和一个人吃顿饭或去旅行，你想叫上谁？地点、味道，或还没说出口的话都可以写。']
    ][game.hookNumber-1];
    return '<div class="modal-backdrop"><section class="hook-card" role="dialog" aria-modal="true" aria-label="写下记忆"><header class="hook-header"><div><small>留下一页 · ' + game.hookNumber + ' / 4</small><h2>' + questions[0] + '</h2></div></header><div class="hook-body"><p class="hook-question">' + questions[1] + '</p><p class="hook-note">没有标准答案。一句话也可以；不方便说的部分可以留白。文字只保存在当前浏览器，之后会装订进你的手札。</p><label class="sr-only" for="memory-answer">这一页的回答</label><textarea id="memory-answer" class="hook-input" data-hook-input maxlength="1600" placeholder="从脑海中第一个画面开始……">' + html(game.hookText) + '</textarea><div class="hook-final-actions"><button class="story-secondary-button" data-action="keep-memory-private">这段先留给自己</button><button class="hook-submit" data-action="submit-hook"' + (game.hookText.trim() ? '' : ' disabled') + '>留下记忆，领取钥匙</button></div></div></section></div>';
  };

  poseIndexFor = function(speaker,text) {
    const line = game.dialogue[game.dialogueIndex];
    if (line && Number.isInteger(line[2]?.pose)) return line[2].pose;
    if (speaker === '门卫') return /封|火漆|指印/.test(text) ? 2 : /代号|凭条|名牌/.test(text) ? 1 : /请|门|保管/.test(text) ? 3 : 0;
    if (speaker === '狐狸面具客') return /等一下|看这里|那个人|证据|指向/.test(text) ? 3 : /对不起|害怕|没|其实|那天/.test(text) ? 2 : /？|想|记得/.test(text) ? 1 : 0;
    if (speaker === '管理员') return /缺|零件|修|下面|记录/.test(text) ? 3 : /好|对。|修好|完成/.test(text) ? 2 : /请|不是|只|核对/.test(text) ? 1 : 0;
    if (speaker === '主持人') return /归还|卡片|名字|领取/.test(text) ? 3 : /摘下|承认|证据成立/.test(text) ? 2 : /烛|灯|日出/.test(text) ? 1 : 0;
    if (speaker === '拾一') return /疼疼疼/.test(text) ? 1 : /？|需要|为什么|也许/.test(text) ? 2 : /等一下|亮|发现|对了/.test(text) ? 3 : 1;
    return 0;
  };
  renderStageSpeaker = function() {
    if (['assembly','finale'].includes(game.scene)) return '';
    let speaker = game.lastSpeaker;
    let text = '';
    if (game.mode === 'dialogue') {
      const line = game.dialogue[game.dialogueIndex] || ['', ''];
      if (speakerArt[line[0]] || line[0] === '拾一') { speaker = line[0]; text = line[1]; }
      if (line[0] === '拾一' && text.includes('疼疼疼') && game.scene === 'ballroom') return '';
    } else if (['talk','present'].includes(game.mode)) speaker = game.talkSpeaker;
    else if (game.mode === 'testimony') speaker = game.testimonyRound === 3 ? '主持人' : '影子';
    else if (game.mode === 'exchange') speaker = '狐狸面具客';
    else return '';
    const art = speaker === '拾一' ? assets.shiyi : speakerArt[speaker];
    if (!art) return '';
    const pose = text ? poseIndexFor(speaker,text) : (speaker === game.lastSpeaker ? game.lastPose : 0);
    return '<div class="stage-speaker speaker-' + speakerSlug(speaker) + '" data-pose="' + pose + '" style="background-image:url(' + art + ');--sprite-x:' + (pose*100/3) + '%;--blink-delay:2s" aria-hidden="true"><span class="blink-pair"><i></i><i></i></span></div>';
  };
  // Emphasis is reserved for clues, rather than every mention of a name.
  formatDialogue = function(text) {
    const safe = html(text);
    const important = /四角星|十七秒|缺角|残片|断线|指印|封条完整|寄存存根|闭馆广播|不等于|三年前|失主是我|日出以前|没有拆封/g;
    return safe.replace(important,'<em class="dialogue-keyword">$&</em>');
  };
  emotionClass = function() {
    if (game.mode !== 'dialogue') return '';
    const line = game.dialogue[game.dialogueIndex] || [];
    if (line[2]?.emotion === 'strong' || /等一下。|异议！|剧烈震动|疼疼疼|失主是我/.test(line[1] || '')) return ' emotion-strong';
    if (line[2]?.emotion === 'hit' || /把它关掉|封条完整/.test(line[1] || '')) return ' emotion-hit';
    return '';
  };
  renderDialogue = function() {
    if (game.mode !== 'dialogue') return '';
    const line = game.dialogue[game.dialogueIndex] || ['旁白',''];
    const name = line[0] === '玩家' ? game.alias || '你' : line[0];
    return '<section class="dialogue-wrap" aria-label="对话"><div class="dialogue-copy"><div class="speaker-row"><span class="speaker-name">' + html(name) + '</span></div><p class="dialogue-text" aria-label="' + html(line[1]) + '">' + formatDialogue(line[1]) + '</p></div><div class="dialogue-actions"><span class="dialogue-counter">' + (game.dialogueIndex+1) + ' / ' + game.dialogue.length + '</span><button class="advance-button" data-action="advance" aria-label="继续对话">继续</button></div></section>';
  };
  function finishTyping() {
    clearTimeout(typingTimer);
    stage.querySelectorAll('.type-char').forEach(node => { node.style.visibility = 'visible'; });
    typingComplete = true;
    stage.querySelector('.dialogue-wrap')?.classList.remove('is-typing');
  }
  function startTyping() {
    clearTimeout(typingTimer);
    const p = stage.querySelector('.dialogue-text');
    if (!p) { typingComplete = true; return; }
    const lineKey = game.scene + ':' + game.dialogueIndex + ':' + p.textContent;
    if (typingKey === lineKey || matchMedia('(prefers-reduced-motion: reduce)').matches) { typingComplete = true; return; }
    typingKey = lineKey;
    const accessibleText = p.textContent;
    const walker = document.createTreeWalker(p,NodeFilter.SHOW_TEXT);
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    const chars = [];
    nodes.forEach(node => {
      const fragment = document.createDocumentFragment();
      Array.from(node.textContent).forEach(char => {
        const span = document.createElement('span'); span.className = 'type-char'; span.textContent = char;
        span.style.visibility = 'hidden'; span.setAttribute('aria-hidden','true'); fragment.append(span); chars.push(span);
      });
      node.replaceWith(fragment);
    });
    const accessibleLine = document.createElement('span');
    accessibleLine.className = 'sr-only';
    accessibleLine.textContent = accessibleText;
    p.append(accessibleLine);
    typingComplete = false;
    stage.querySelector('.dialogue-wrap')?.classList.add('is-typing');
    let index = 0;
    function tick() {
      if (!chars[index] || !chars[index].isConnected) { typingComplete = true; return; }
      chars[index++].style.visibility = 'visible';
      if (index === chars.length) { finishTyping(); return; }
      typingTimer = setTimeout(tick, /[。！？…]/.test(chars[index-1].textContent) ? 80 : 15);
    }
    tick();
  }

  function currentGoal() {
    const scene = sceneState();
    if (isSceneComplete()) return '这里的线索已经整理完毕。可以继续前行。';
    if (game.scene === 'collection' && game.flags.hook2 && !game.flags.collectionDrawerOpened) return '钥匙已经在手里。回到隐藏抽屉，把它打开。';
    if (readyLogic().length) return '有一项可以进行的证物检查，已记在「线索对照」里。';
    if ((scene.required || []).some(key => !sceneInspected(key))) return scene.objective;
    const groups = conversationGroups();
    const unread = Object.keys(groups).filter(name => availableTopics(name).some(topic => !game.talked[talkKey(name,topic.id)]));
    if (unread.length) return unread.join('、') + '还有没谈过的话题。';
    return '有人还没说完。向与线索有关的人出示证物，继续追问。';
  }
  renderTalkButton = () => '';
  renderProgressionTip = () => '';
  function renderToolbar() {
    if (game.mode !== 'investigate') return '';
    const speakers = Object.keys(conversationGroups());
    return '<div class="case-goal"><small>' + chapterTitle() + '</small><span>' + html(currentGoal()) + '</span></div><nav class="case-toolbar" aria-label="调查操作"><button data-action="show-places">调查<span>查看物件</span></button>' +
      (speakers.length ? '<button data-action="open-talk">交谈<span>' + unreadTalkCount() + ' 个未谈话题</span></button>' : '') +
      '<button data-action="toggle-evidence">证物<span>' + game.evidence.length + ' 件已记录</span></button><button data-action="show-hint">拾一提示<span>卡住时看看</span></button>' +
      (isSceneComplete() ? '<button class="toolbar-next" data-action="' + sceneState().nextAction + '">前往下一处<span>' + sceneState().nextLabel + ' ›</span></button>' : '') + '</nav>';
  }
  function renderResidents() {
    if (game.mode !== 'investigate' || game.scene !== 'ballroom') return '';
    return '<div class="scene-resident" data-resident="fox" style="background-image:url(' + assets.fox + ')" aria-hidden="true"></div><div class="scene-resident" data-resident="host" style="background-image:url(' + assets.host + ')" aria-hidden="true"></div>';
  }
  function renderPlaces() {
    if (!game.placesOpen) return '';
    return '<div class="modal-backdrop"><section class="investigation-list" role="dialog" aria-modal="true" aria-label="调查物件"><header><small>场景调查</small><h2>' + sceneState().title + '</h2><p>也可以直接点击画面里的物件。已调查的物件可再次查看。</p></header><div>' + Object.entries(sceneState().objects).map(([key,item]) => '<button data-object="' + key + '"><span>' + (sceneInspected(key) ? '✓' : '⌕') + '</span>' + item.label + '<small>' + (sceneInspected(key) ? '已调查' : '未调查') + '</small></button>').join('') + '</div><button class="talk-close" data-action="close-places">返回场景</button></section></div>';
  }
  function showHint() {
    game.hintLevel += 1;
    let message = currentGoal();
    if (game.hintLevel > 1) {
      const ready = readyLogic()[0];
      if (ready) message = logicCases[ready[0]].hint;
      else {
        const speaker = Object.keys(conversationGroups()).find(name => availableTopics(name).some(topic => !game.talked[talkKey(name,topic.id)]));
        const pending = Object.entries(presentations[game.scene] || {}).flatMap(([name,rules]) => Object.keys(rules).filter(id => game.evidence.includes(id) && !game.presented[game.scene+':'+name+':'+id]).map(id => [name,id]));
        if (speaker) message = '去与' + speaker + '交谈。还没打勾的话题里，有我们需要补上的信息。';
        else if (pending.length) message = '把「' + evidenceCatalog[pending[0][1]][0] + '」出示给' + pending[0][0] + '，听听这件东西与对方的关系。';
        else message = progressionHint();
      }
    }
    triggerDialogue([['拾一',message]],'investigate');
  }
  function renderLog() {
    if (!game.logOpen) return '';
    return '<div class="log-backdrop"><section class="dialogue-log" role="dialog" aria-modal="true" aria-label="对话回看"><header><h2>这一夜的对话</h2><button class="record-close" data-action="toggle-log">返回</button></header><div class="log-lines">' + (game.history.length ? game.history.map(line => '<article class="log-line"><strong>' + html(line.speaker) + '</strong><p>' + formatDialogue(line.text) + '</p></article>').join('') : '<p>故事开始后，对话会留在这里。</p>') + '</div></section></div>';
  }
  renderChapterMap = function() {
    if (!game.chapterMapOpen) return '';
    const current = sceneState().chapter || 8;
    const titles = [scenes.entrance,scenes.echo,scenes.collection,scenes.anyHouse,scenes.kitchen,scenes.shadow,scenes.assembly,scenes.finale];
    return '<div class="chapter-map-backdrop"><section class="chapter-map-card" role="dialog" aria-modal="true" aria-label="旅程进度"><header class="chapter-map-header"><h2>今夜的旅程</h2><button class="record-close" data-action="toggle-chapters">返回</button></header><div class="chapter-map-list">' + titles.map((scene,i) => '<div class="chapter-map-item' + (i+1<current?' is-done':i+1===current?' is-current':'') + '"><span class="chapter-map-index">' + String(i+1).padStart(2,'0') + '</span><div><strong>' + (i+1<=current ? scene.title.split(' · ')[1] : '尚未抵达') + '</strong><span>' + (i+1<current ? '已完成' : i+1===current ? '你在这里' : '继续调查后开启') + '</span></div></div>').join('') + '</div></section></div>';
  };
  renderSystemControls = function() {
    return '<nav class="system-controls" aria-label="游戏菜单"><button class="system-button" data-action="toggle-log">回看</button><button class="system-button" data-action="save-game">保存</button><button class="system-button" data-action="toggle-chapters">旅程</button><button class="system-button" data-action="return-title">标题</button></nav>';
  };
  renderEnding = function() {
    return '<section class="game-shell"><div class="scene-bg" style="background-image:url(' + assets.epilogue + ')"></div><div class="end-panel"><div class="end-card"><span class="chapter-kicker">第〇夜 · 完</span><p class="end-question">封印姓名的我们，会失去什么？</p><h1>失去束缚，获得新生。</h1><p>门外天亮了。这一次，合照里留着你的位置。</p><div class="end-actions"><button class="start-button" data-action="openJournal">翻开我的手札</button><button class="story-secondary-button" data-action="download-journal">保存手札</button><button class="story-secondary-button" data-action="return-title">返回标题</button></div></div></div>' + renderAudioControls() + '</section>';
  };
  renderTitle = function() {
    let result = base.renderTitle();
    if (hasSavedGame()) result = result.replace('>开始故事</button>','>重新开始</button>');
    return result.replace('</div></section>','</div></section>');
  };
  renderGame = function() {
    let result = base.renderGame();
    if (game.mode === 'investigate') result = result.replace(/<button class="next-scene-button"[\s\S]*?<\/button>/,'');
    const extras = renderResidents() + renderToolbar() + renderLogic() + renderTestimony() + renderExchange() + renderJournal() + renderPlaces() + renderLog() + (game.restartPrompt ? '<div class="modal-backdrop"><section class="story-choice-card" role="dialog" aria-modal="true" aria-label="重新开始"><h2>重新打开那封请柬？</h2><p>这会替换本版的当前进度。你也可以继续原来的故事。</p><div class="story-choice-actions"><button class="story-secondary-button" data-action="cancel-new-game">保留进度</button><button class="story-primary-button" data-action="confirm-new-game">重新开始</button></div></section></div>' : '');
    const closing = result.lastIndexOf('</section>');
    return result.slice(0,closing) + extras + result.slice(closing);
  };
  setScene = function(id) {
    game.lastSpeaker = null; game.hintLevel = 0; game.placesOpen = false;
    base.setScene(id);
  };
  runAction = function(action) {
    if (action === 'identityChoice') { startTestimony(); return; }
    if (action === 'returnTestimony') { game.mode = 'testimony'; render(); return; }
    if (action === 'nextTestimony') { game.testimonyRound += 1; game.testimonyIndex = 0; startTestimony(); return; }
    if (action === 'exchangeChoice') { game.mode = 'exchange'; render(); return; }
    if (action === 'goEpilogue' && !game.exchangeConfirmed) { game.mode = 'exchange'; render(); return; }
    if (action === 'openJournal') { game.mode = 'journal'; game.journalPage = -1; game.evidenceOpen = false; render(); return; }
    if (action === 'restart') { Object.assign(game,fresh()); }
    base.runAction(action);
  };

  // Match hit areas to the actual image rectangle, including portrait screens.
  function layoutScene() {
    const bg = stage.querySelector('.scene-bg');
    if (!bg) return;
    bg.style.backgroundRepeat = 'no-repeat';
    bg.style.backgroundColor = '#101417';
    const asset = (bg.style.backgroundImage.match(/url\(["']?([^"')]+)/) || [])[1];
    if (!asset) return;
    const size = imageSizes.get(asset);
    if (!size) {
      const img = new Image(); imageSizes.set(asset,[0,0]);
      img.onload = () => { imageSizes.set(asset,[img.naturalWidth,img.naturalHeight]); layoutScene(); };
      img.src = asset; return;
    }
    if (!size[0]) return;
    const width = stage.clientWidth, height = stage.clientHeight;
    const portrait = width < height * .9;
    const areaHeight = portrait ? Math.min(height*.66,width*size[1]/size[0]) : height;
    const scale = Math.min(width/size[0],areaHeight/size[1]);
    const w = size[0]*scale, h = size[1]*scale;
    const x = (width-w)/2, y = portrait ? 56 : (height-h)/2;
    bg.style.backgroundSize = w + 'px ' + h + 'px';
    bg.style.backgroundPosition = x + 'px ' + y + 'px';
    bg.style.transform = 'none';
    stage.querySelectorAll('.scene-resident').forEach(node => {
      const resident = node.dataset.resident === 'fox' ? .25 : .77;
      const rw = w * .135;
      node.style.width = rw + 'px';
      node.style.height = rw * 2.67 + 'px';
      node.style.left = (x + w*resident - rw/2) + 'px';
      node.style.top = (y + h*.83 - rw*2.67) + 'px';
    });
    stage.querySelectorAll('.hotspot').forEach(node => {
      const item = sceneState().objects[node.dataset.object];
      const region = investigationRegions[game.scene+':'+node.dataset.object] || [14,18];
      node.style.left = (x + item.x*w/100) + 'px'; node.style.top = (y + item.y*h/100) + 'px';
      node.style.width = region[0]*w/100 + 'px'; node.style.height = region[1]*h/100 + 'px';
    });
  }
  mount = function() {
    const previousFocus = document.activeElement;
    const focusAction = previousFocus?.dataset?.action;
    const focusEvidence = previousFocus?.dataset?.evidence;
    noteCurrentLine();
    const oldBg = stage.querySelector('.scene-bg');
    const oldSpeaker = stage.querySelector('.stage-speaker');
    const oldBgStyle = oldBg?.style.backgroundImage;
    stage.innerHTML = renderGame();
    const newBg = stage.querySelector('.scene-bg');
    if (oldBg && newBg && oldBgStyle === newBg.style.backgroundImage) newBg.replaceWith(oldBg);
    const newSpeaker = stage.querySelector('.stage-speaker');
    if (oldSpeaker && newSpeaker && oldSpeaker.className === newSpeaker.className) {
      oldSpeaker.style.backgroundImage = newSpeaker.style.backgroundImage;
      oldSpeaker.style.setProperty('--sprite-x',newSpeaker.style.getPropertyValue('--sprite-x'));
      oldSpeaker.dataset.pose = newSpeaker.dataset.pose;
      newSpeaker.replaceWith(oldSpeaker);
    }
    syncBackgroundMusic();
    layoutScene();
    startTyping();
    if (game.logOpen) { const log = stage.querySelector('.log-lines'); if (log) log.scrollTop = log.scrollHeight; }
    if (focusAction && !['advance','dismiss-evidence'].includes(focusAction)) {
      const match = [...stage.querySelectorAll('[data-action]')].find(node => node.dataset.action === focusAction && (!focusEvidence || node.dataset.evidence === focusEvidence));
      match?.focus({preventScroll:true});
    }
    saveGame(false);
  };

  const ownActions = new Set(['dismiss-evidence','open-logic','logic-select','logic-confirm','logic-cancel','testimony-prev','testimony-next','testimony-press','testimony-present','testimony-evidence','testimony-cancel','select-memory','confirm-exchange','journal-open','journal-prev','journal-next','journal-finish','download-journal','toggle-log','show-places','close-places','show-hint','confirm-new-game','cancel-new-game','keep-memory-private']);
  stage.addEventListener('click',event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === 'start' && hasSavedGame()) {
      event.stopImmediatePropagation(); game.restartPrompt = true; render(); return;
    }
    if (!ownActions.has(action)) return;
    event.stopImmediatePropagation();
    unlockAudio(); playSfx('click');
    if (action === 'dismiss-evidence') { dismissEvidence(); return; }
    if (action === 'keep-memory-private') { game.hookText = '这一页，我想先留给自己。'; submitHook(); return; }
    if (action === 'open-logic') { openLogic(button.dataset.logic); return; }
    if (action === 'logic-select') {
      const id = button.dataset.evidence;
      const index = game.logicSelection.indexOf(id);
      if (index >= 0) game.logicSelection.splice(index,1);
      else if (game.logicSelection.length < logicCases[game.logicId].ids.length) game.logicSelection.push(id);
      else game.logicFeedback = '对照位已满。先取消一件，再放入另一件。';
    } else if (action === 'logic-confirm') { confirmLogic(); return; }
    else if (action === 'logic-cancel') game.mode = 'investigate';
    else if (action === 'testimony-next' || action === 'testimony-prev') {
      const total = testimony[game.testimonyRound].statements.length;
      game.testimonyIndex = (game.testimonyIndex + (action.endsWith('next') ? 1 : total-1)) % total;
      game.testimonyFeedback = '';
    } else if (action === 'testimony-press') {
      const item = testimony[game.testimonyRound];
      game.testimonyPressed[game.testimonyRound+':'+game.testimonyIndex] = true;
      triggerDialogue([['玩家','请把这一点说清楚。'],['拾一',item.press[game.testimonyIndex]]],'returnTestimony'); return;
    } else if (action === 'testimony-present') { game.testimonyPicker = true; game.testimonyFeedback = ''; }
    else if (action === 'testimony-cancel') game.testimonyPicker = false;
    else if (action === 'testimony-evidence') { submitTestimony(button.dataset.evidence); return; }
    else if (action === 'select-memory') {
      if (game.exchangeChoice !== button.dataset.memory) game.exchangeText = game.hookAnswers[Number(button.dataset.memory)] || '';
      game.exchangeChoice = button.dataset.memory;
    }
    else if (action === 'confirm-exchange') { confirmExchange(); return; }
    else if (action === 'journal-open') game.journalPage = 0;
    else if (action === 'journal-prev') game.journalPage = Math.max(-1,game.journalPage-1);
    else if (action === 'journal-next') game.journalPage = Math.min(3,game.journalPage+1);
    else if (action === 'journal-finish') { game.flags.storyFinished = true; game.mode = 'ending'; }
    else if (action === 'download-journal') { downloadJournal(); return; }
    else if (action === 'toggle-log') { game.logOpen = !game.logOpen; if (game.logOpen) finishTyping(); }
    else if (action === 'show-places') game.placesOpen = true;
    else if (action === 'close-places') game.placesOpen = false;
    else if (action === 'show-hint') { showHint(); return; }
    else if (action === 'confirm-new-game') { startGame(); return; }
    else if (action === 'cancel-new-game') game.restartPrompt = false;
    render();
  },true);
  stage.addEventListener('input',event => {
    if (event.target.matches('[data-exchange-input]')) {
      game.exchangeText = event.target.value;
      const button = stage.querySelector('[data-action="confirm-exchange"]');
      if (button) button.disabled = !game.exchangeText.trim();
    }
    clearTimeout(inputSaveTimer); inputSaveTimer = setTimeout(() => saveGame(false),300);
  });
  function closeTopPanel() {
    if (game.restartPrompt) game.restartPrompt = false;
    else if (game.logOpen) game.logOpen = false;
    else if (game.testimonyPicker) game.testimonyPicker = false;
    else if (game.evidenceOpen) game.evidenceOpen = false;
    else if (game.chapterMapOpen) game.chapterMapOpen = false;
    else if (game.placesOpen) game.placesOpen = false;
    else if (game.mode === 'present') game.mode = 'talk';
    else if (['talk','logic','alias'].includes(game.mode)) game.mode = 'investigate';
    else return false;
    render(); return true;
  }
  document.addEventListener('keydown',event => {
    if (event.isComposing || event.repeat) return;
    if (event.key === 'Tab') {
      const modal = [...stage.querySelectorAll('[aria-modal="true"]')].at(-1);
      if (modal) {
        const controls = [...modal.querySelectorAll('button:not([disabled]),input,textarea,[tabindex="0"]')].filter(node => node.getClientRects().length);
        const first = controls[0], last = controls.at(-1);
        if (first && (!modal.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last))) { event.preventDefault(); first.focus(); }
        else if (last && event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      }
    }
    const input = event.target.closest('input,textarea,select,[contenteditable="true"]');
    if (event.key === 'Escape') { if (closeTopPanel()) { event.preventDefault(); event.stopImmediatePropagation(); } return; }
    if (input) return;
    if (game.evidenceNoticeQueue.length && ['Enter',' '].includes(event.key)) {
      event.preventDefault(); event.stopImmediatePropagation(); dismissEvidence(); return;
    }
    if (game.logOpen || game.chapterMapOpen || game.placesOpen || game.restartPrompt) return;
    if (['j','J'].includes(event.key) && !['title','ending','journal'].includes(game.mode)) {
      event.preventDefault(); game.evidenceOpen = !game.evidenceOpen; render(); return;
    }
    if (['l','L'].includes(event.key) && game.mode !== 'title') { event.preventDefault(); game.logOpen = true; finishTyping(); render(); return; }
    if (game.evidenceOpen) return;
    if (game.mode === 'dialogue' && ['Enter',' '].includes(event.key) && (!event.target.closest('button') || event.target.dataset.action === 'advance')) {
      event.preventDefault(); event.stopImmediatePropagation(); advanceDialogue(); return;
    }
    const arrow = event.key === 'ArrowRight' ? 'next' : event.key === 'ArrowLeft' ? 'prev' : null;
    if (arrow && game.mode === 'testimony' && !game.testimonyPicker && game.testimonyRound < 3) { event.preventDefault(); stage.querySelector('[data-action="testimony-'+arrow+'"]').click(); }
    if (arrow && game.mode === 'journal') { event.preventDefault(); stage.querySelector('[data-action="journal-'+arrow+'"]')?.click(); }
  },true);
  window.addEventListener('resize',layoutScene);
  window.addEventListener('pagehide',() => saveGame(false));
  document.addEventListener('visibilitychange',() => { if (document.hidden) saveGame(false); });
  mount();
})();
