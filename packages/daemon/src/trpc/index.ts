import { login } from '@/trpc/login';
import { batchQueryBrief, listNotJoined } from '@/trpc/discover';
import { getServers, getUnreadCount, settleRejected } from '@/trpc/user';
import { fetchReceivedApply } from '@/trpc/manage/apply';
import { fetchAccessApply, submitAccessApply } from '@/trpc/access';
import { getLatestForm, joinByInvitationCode, submitApply } from '@/trpc/server/join';
import { getServerInnerInfo, getServerPublicInfo } from '@/trpc/server/info';
import { router } from '@/common/trpc';
import { checkChatId, checkUsername, registerSubmit } from '@/trpc/register';

export const appRouter = router({
    login: login,
    register: {
        checkChatId: checkChatId,
        checkUsername: checkUsername,
        submit: registerSubmit,
    },
    access: {
        submit: submitAccessApply,
        get: fetchAccessApply,
    },
    discover: {
        list: listNotJoined,
        brief: batchQueryBrief,
    },
    server: {
        join: {
            getLatestForm: getLatestForm,
            submit: submitApply,
            useCode: joinByInvitationCode,
        },
        info: {
            get: getServerPublicInfo,
            getInner: getServerInnerInfo,
        },
    },
    user: {
        getServers: getServers,
        getUnreadCount: getUnreadCount,
        settleRejected: settleRejected,
    },
    manage: {
        apply: {
            get: fetchReceivedApply,
        },
    },
});