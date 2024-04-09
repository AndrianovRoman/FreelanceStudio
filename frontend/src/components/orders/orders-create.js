import {HttpUtils} from "../../utils/http-utils";
import {ValidationUtils} from "../../utils/validation-utils";

export class OrdersCreate {
    constructor(openNewRoute) {
        this.openNewRoute = openNewRoute;

        document.getElementById('saveButton').addEventListener('click', this.saveOrder.bind(this));

        this.findElements();

        this.scheduledDate = null;
        this.completeDate = null;
        this.deadlineDate = null;

        this.validations = [
            {element: this.amountInputElement},
            {element: this.descriptionInputElement},
            {element: this.scheduledCardElement, options: {checkProperty: this.scheduledDate}},
            {element: this.deadlineCardElement, options: {checkProperty: this.deadlineDate}},
        ];

        const calendarOptions = {
            inline: true,
            locale: 'ru',
            icons: {
                time: 'far fa-clock',
            },
            useCurrent: false,
        }

        const calendarScheduled = $('#calendar-scheduled');
        calendarScheduled.datetimepicker(calendarOptions);
        calendarScheduled.on("change.datetimepicker", (e) => {
            this.scheduledDate = e.date;
            for (let i = 0; i < this.validations.length; i++) {
                if(this.validations[i].element === this.scheduledCardElement) {
                    this.validations[i].options.checkProperty = this.scheduledDate;
                }
            }
        });

        const calendarDeadline = $('#calendar-deadline');
        calendarDeadline.datetimepicker(calendarOptions);
        calendarDeadline.on("change.datetimepicker", (e) => {
            this.deadlineDate = e.date;
            for (let i = 0; i < this.validations.length; i++) {
                if(this.validations[i].element === this.deadlineCardElement) {
                    this.validations[i].options.checkProperty = this.deadlineDate;
                }
            }

        });

        const calendarComplete = $('#calendar-complete');
        calendarOptions.buttons = {
            showClear: true,
        }
        calendarComplete.datetimepicker(calendarOptions);
        calendarComplete.on("change.datetimepicker", (e) => {
            this.completeDate = e.date;
        });

        this.getFreelancers().then();
    }

    findElements() {
        this.freelancerSelectElement = document.getElementById('freelancerSelect');
        this.statusSelectElement = document.getElementById('statusSelect');
        this.amountInputElement = document.getElementById('amountInput');
        this.descriptionInputElement = document.getElementById('descriptionInput');
        this.scheduledCardElement = document.getElementById('scheduled-card');
        this.completeCardElement = document.getElementById('complete-card');
        this.deadlineCardElement = document.getElementById('deadline-card');
    }

    async getFreelancers() {
        const result = await HttpUtils.request('/freelancers');
        if(result.redirect) {
            return this.openNewRoute(result.redirect);
        }

        if(result.error || !result.response || (result.response && (result.response.error || !result.response.freelancers))) {
            return alert('Возникла ошибка при запросе фрилансеров. Обратитесь в поддержку.');
        }

        const freelancers = result.response.freelancers;
        for (let i = 0; i < freelancers.length; i++) {
            const option = document.createElement('option');
            option.value = freelancers[i].id;
            option.innerText = freelancers[i].name + ' ' + freelancers[i].lastName;
            this.freelancerSelectElement.appendChild(option);
        };

        $(this.freelancerSelectElement).select2({
            theme: 'bootstrap4'
        });
    }

    async saveOrder(e){
        e.preventDefault();

        if(ValidationUtils.validateForm(this.validations)) {
            const createData = {
                description: this.descriptionInputElement.value,
                deadlineDate: this.deadlineDate.toISOString(),
                scheduledDate: this.scheduledDate.toISOString(),
                freelancer: this.freelancerSelectElement.value,
                status: this.statusSelectElement.value,
                amount: parseInt(this.amountInputElement.value),
            };

            if (this.completeDate) {
                createData.completeDate = this.completeDate.toISOString();
            }

            console.log(createData);

            const result = await HttpUtils.request('/orders', 'POST', true, createData);
            if(result.redirect) {
                return this.openNewRoute(result.redirect);
            }

            if(result.error || !result.response || (result.response && result.response.error)) {
                return alert('Возникла ошибка при создании заказа. Обратитесь в поддержку.');
            }

            return this.openNewRoute('/orders/view?id=' + result.response.id);
        }

    }

}